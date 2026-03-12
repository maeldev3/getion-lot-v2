import { defineStore } from 'pinia'

export const useRelevesStore = defineStore('releves', () => {
  const supabase = useSupabaseClient()

  const releves = ref([])
  const factures = ref([])
  const loading = ref(false)
  const error = ref(null)

  const TARIFF = {
    prix_unitaire: 1400,
    seuil_surconsommation: 10,
    taux_surconsommation: 0.20,
    taux_redevance_renouvellement: 0.02,
    taux_assainissement: 0.02,
    taux_branchement_social: 0.02,
    taux_taxe_communale: 0.02,
  }

  // Calculate facture amounts from consumption
  function calculateFacture(consommation) {
    const pu = TARIFF.prix_unitaire
    const montant_ht = consommation * pu
    const redevance_renouvellement = montant_ht * TARIFF.taux_redevance_renouvellement
    const redevance_assainissement = montant_ht * TARIFF.taux_assainissement
    const redevance_branchement = montant_ht * TARIFF.taux_branchement_social
    const taxe_communale = montant_ht * TARIFF.taux_taxe_communale
    const surconsommation = consommation > TARIFF.seuil_surconsommation
      ? (consommation - TARIFF.seuil_surconsommation) * pu * TARIFF.taux_surconsommation
      : 0
    const montant_ttc = montant_ht + redevance_renouvellement + redevance_assainissement + 
                        redevance_branchement + taxe_communale + surconsommation
    return {
      montant_ht: Math.round(montant_ht),
      redevance_renouvellement: Math.round(redevance_renouvellement),
      redevance_assainissement: Math.round(redevance_assainissement),
      redevance_branchement: Math.round(redevance_branchement),
      taxe_communale: Math.round(taxe_communale),
      surconsommation: Math.round(surconsommation),
      montant_ttc: Math.round(montant_ttc),
    }
  }

  async function fetchReleves(options = {}) {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('releves')
        .select(`
          *,
          client:clients(id, numero, nom_prenom, ref_compteur, categorie, fokontany,
            zone:zones(name)),
          facture:factures(*)
        `)
        .order('annee', { ascending: false })
        .order('mois', { ascending: false })

      if (options.clientId) query = query.eq('client_id', options.clientId)
      if (options.annee) query = query.eq('annee', options.annee)
      if (options.mois) query = query.eq('mois', options.mois)

      const { data, error: err } = await query
      if (err) throw err
      releves.value = data || []
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function saveReleve(releveData) {
    loading.value = true
    error.value = null
    try {
      const consommation = releveData.nouvel_index - releveData.ancien_index

      // Upsert releve
      const { data: releve, error: rErr } = await supabase
        .from('releves')
        .upsert({
          client_id: releveData.client_id,
          annee: releveData.annee,
          mois: releveData.mois,
          ancien_index: releveData.ancien_index,
          nouvel_index: releveData.nouvel_index,
          date_releve: releveData.date_releve,
          date_limite_paiement: releveData.date_limite_paiement,
          observation: releveData.observation,
        }, { onConflict: 'client_id,annee,mois' })
        .select()
        .single()
      if (rErr) throw rErr

      // Calculate and upsert facture
      const calc = calculateFacture(consommation)
      
      // Generate facture number
      const { data: clientData } = await supabase
        .from('clients').select('numero').eq('id', releveData.client_id).single()
      
      const numeroFacture = `${String(clientData.numero).padStart(2,'0')}/${releveData.annee}`

      const { data: facture, error: fErr } = await supabase
        .from('factures')
        .upsert({
          releve_id: releve.id,
          client_id: releveData.client_id,
          numero_facture: numeroFacture,
          annee: releveData.annee,
          mois: releveData.mois,
          consommation_m3: consommation,
          prix_unitaire: TARIFF.prix_unitaire,
          redevance_renouvellement: calc.redevance_renouvellement,
          redevance_assainissement: calc.redevance_assainissement,
          redevance_branchement: calc.redevance_branchement,
          taxe_communale: calc.taxe_communale,
          surconsommation: calc.surconsommation,
          montant_ttc: calc.montant_ttc,
          statut: 'IMPAYEE',
        }, { onConflict: 'releve_id' })
        .select()
        .single()
      if (fErr) throw fErr

      return { releve, facture, calcul: calc }
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function enregistrerPaiement(factureId, montant, options = {}) {
    loading.value = true
    try {
      const { data: facture } = await supabase
        .from('factures').select('montant_ttc, montant_paye').eq('id', factureId).single()

      const newMontantPaye = (facture.montant_paye || 0) + montant
      const statut = newMontantPaye >= facture.montant_ttc ? 'PAYEE' : 'PARTIELLE'

      const { error: fErr } = await supabase
        .from('factures')
        .update({ montant_paye: newMontantPaye, statut, date_paiement: new Date().toISOString() })
        .eq('id', factureId)
      if (fErr) throw fErr

      const { error: pErr } = await supabase.from('paiements').insert({
        facture_id: factureId,
        montant,
        mode_paiement: options.mode_paiement || 'ESPECES',
        reference_paiement: options.reference,
        notes: options.notes,
      })
      if (pErr) throw pErr

      return { statut, newMontantPaye }
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchFactures(options = {}) {
    loading.value = true
    try {
      let query = supabase
        .from('factures')
        .select(`
          *,
          client:clients(id, numero, nom_prenom, ref_compteur, categorie,
            zone:zones(name)),
          paiements(*)
        `)
        .order('annee', { ascending: false })
        .order('mois', { ascending: false })

      if (options.clientId) query = query.eq('client_id', options.clientId)
      if (options.annee) query = query.eq('annee', options.annee)
      if (options.mois) query = query.eq('mois', options.mois)
      if (options.statut) query = query.eq('statut', options.statut)

      const { data, error: err } = await query
      if (err) throw err
      factures.value = data || []
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchRecapConsommations(annee, mois) {
    const { data, error: err } = await supabase
      .from('v_recap_consommations')
      .select('*')
      .eq('annee', annee)
      .eq('mois', mois)
      .order('numero')
    if (err) throw err
    return data
  }

  async function fetchRelevesAnnuels(annee) {
    const { data, error: err } = await supabase
      .from('v_releves_annuels')
      .select('*')
      .eq('annee', annee)
      .order('numero')
    if (err) throw err
    return data
  }

  return {
    releves, factures, loading, error, TARIFF,
    calculateFacture, fetchReleves, saveReleve, 
    enregistrerPaiement, fetchFactures,
    fetchRecapConsommations, fetchRelevesAnnuels
  }
})
