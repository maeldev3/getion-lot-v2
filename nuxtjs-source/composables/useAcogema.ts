// composables/useClients.ts
import type { Client, FormClient, FiltreClients } from '~/types'

export function useClients() {
  const supabase = useSupabaseClient()
  const auth = useAuthStore()
  const clients = ref<Client[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchClients(filtres?: FiltreClients) {
    if (!auth.agenceId) return
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('clients')
        .select(`
          *,
          zone:zones(id, nom),
          dernier_releve:releves(
            id, annee, mois, consommation, statut, date_releve
          )
        `)
        .eq('agence_id', auth.agenceId)
        .order('nom_prenom')

      if (filtres?.is_active !== undefined) query = query.eq('is_active', filtres.is_active)
      if (filtres?.zone_id) query = query.eq('zone_id', filtres.zone_id)
      if (filtres?.categorie) query = query.eq('categorie', filtres.categorie)
      if (filtres?.search) query = query.ilike('nom_prenom', `%${filtres.search}%`)

      const { data, error: err } = await query
      if (err) throw err
      clients.value = data as Client[]
    } catch (e: unknown) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function createClient(form: FormClient) {
    if (!auth.agenceId) throw new Error('Agence introuvable')
    const { data, error: err } = await supabase
      .from('clients')
      .insert({
        ...form,
        agence_id: auth.agenceId,
        created_by: auth.user?.id,
      })
      .select()
      .single()
    if (err) throw err
    await auth.logAudit('CREATE', 'clients', data.id)
    await fetchClients()
    return data
  }

  async function updateClient(id: string, updates: Partial<FormClient>) {
    const { error: err } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
    if (err) throw err
    await auth.logAudit('UPDATE', 'clients', id)
    await fetchClients()
  }

  async function deleteClient(id: string) {
    const { error: err } = await supabase
      .from('clients')
      .update({ is_active: false })
      .eq('id', id)
    if (err) throw err
    await auth.logAudit('DELETE', 'clients', id)
    await fetchClients()
  }

  return { clients, loading, error, fetchClients, createClient, updateClient, deleteClient }
}

// composables/useReleves.ts
export function useReleves() {
  const supabase = useSupabaseClient()
  const auth = useAuthStore()
  const releves = ref([])
  const loading = ref(false)

  async function fetchReleves(annee?: number, mois?: number) {
    if (!auth.agenceId) return
    loading.value = true
    let query = supabase
      .from('releves')
      .select(`*, client:clients(id, nom_prenom, ref_compteur, fokontany, zone:zones(nom))`)
      .eq('agence_id', auth.agenceId)
      .order('created_at', { ascending: false })

    if (annee) query = query.eq('annee', annee)
    if (mois) query = query.eq('mois', mois)

    const { data } = await query
    releves.value = data ?? []
    loading.value = false
  }

  async function saisirReleve(form: {
    client_id: string
    annee: number
    mois: number
    ancien_index: number
    nouvel_index: number
    date_releve: string
    observations?: string
  }) {
    if (!auth.agenceId) throw new Error('Agence introuvable')
    if (form.nouvel_index <= form.ancien_index) throw new Error('Nouvel index doit être supérieur à l\'ancien index')

    const { data, error } = await supabase
      .from('releves')
      .upsert({
        ...form,
        agence_id: auth.agenceId,
        saisi_par: auth.user?.id,
        statut: 'saisi',
      })
      .select()
      .single()
    if (error) throw error

    await auth.logAudit('CREATE', 'releves', data.id)
    return data
  }

  async function genererFacture(releveId: string) {
    const { data, error } = await supabase.rpc('calculer_facture', { p_releve_id: releveId })
    if (error) throw error
    await auth.logAudit('CREATE', 'factures', data)
    return data
  }

  async function saisirEtFacturer(form: Parameters<typeof saisirReleve>[0]) {
    const releve = await saisirReleve(form)
    const factureId = await genererFacture(releve.id)
    return { releve, factureId }
  }

  return { releves, loading, fetchReleves, saisirReleve, genererFacture, saisirEtFacturer }
}

// composables/useFactures.ts
export function useFactures() {
  const supabase = useSupabaseClient()
  const auth = useAuthStore()
  const factures = ref([])
  const loading = ref(false)

  async function fetchFactures(annee?: number, mois?: number, statut?: string) {
    if (!auth.agenceId) return
    loading.value = true
    let query = supabase
      .from('factures')
      .select(`*, client:clients(id, nom_prenom, ref_client, ref_compteur, fokontany, categorie)`)
      .eq('agence_id', auth.agenceId)
      .order('created_at', { ascending: false })

    if (annee) query = query.eq('annee', annee)
    if (mois) query = query.eq('mois', mois)
    if (statut) query = query.eq('statut_paiement', statut)

    const { data } = await query
    factures.value = data ?? []
    loading.value = false
  }

  async function enregistrerPaiement(factureId: string, form: {
    montant: number
    mode_paiement: string
    reference?: string
    date_paiement: string
    notes?: string
  }) {
    if (!auth.agenceId) throw new Error('Agence introuvable')

    // Récupérer la facture
    const { data: facture } = await supabase
      .from('factures')
      .select('id, client_id, total_ttc, montant_paye')
      .eq('id', factureId)
      .single()

    if (!facture) throw new Error('Facture introuvable')

    // Insérer paiement
    const { data: paiement, error } = await supabase
      .from('paiements')
      .insert({
        facture_id: factureId,
        client_id: facture.client_id,
        agence_id: auth.agenceId,
        encaisse_par: auth.user?.id,
        ...form,
      })
      .select()
      .single()
    if (error) throw error

    // Mettre à jour statut facture
    const nouveauMontantPaye = (facture.montant_paye ?? 0) + form.montant
    const statut = nouveauMontantPaye >= facture.total_ttc ? 'paye' : 'en_attente'
    await supabase
      .from('factures')
      .update({
        montant_paye: nouveauMontantPaye,
        statut_paiement: statut,
        date_paiement: statut === 'paye' ? form.date_paiement : null,
        mode_paiement: form.mode_paiement,
      })
      .eq('id', factureId)

    await auth.logAudit('PAYMENT', 'paiements', paiement.id)
    await fetchFactures()
    return paiement
  }

  async function genererPdfFacture(facture: unknown) {
    // Génération PDF côté client avec jspdf
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const f = facture as Record<string, unknown>
    const c = (f.client ?? {}) as Record<string, unknown>

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const moisNom = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

    // En-tête
    doc.setFillColor(0, 119, 182)
    doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('ACOGEMA', 20, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Agence BEFORONA | Tel: 038 10 457 38 | rehasajp@yahoo.com', 20, 26)
    doc.text(`FACTURE N° ${f.numero_facture}`, 140, 18)
    doc.text(`Émise le: ${f.date_emission}`, 140, 26)

    // Infos client
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Client:', 20, 50)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`${c.nom_prenom}`, 20, 58)
    doc.text(`Réf: ${c.ref_client} | Compteur: ${c.ref_compteur}`, 20, 65)
    doc.text(`Fokontany: ${c.fokontany} | Catégorie: ${c.categorie}`, 20, 72)
    doc.text(`Période: ${moisNom[f.mois as number]} ${f.annee}`, 20, 79)

    // Tableau détails
    autoTable(doc, {
      startY: 90,
      head: [['Désignation', 'Quantité', 'Taux', 'PU (Ar)', 'Montant (Ar)']],
      body: [
        ['Consommation hors taxe', `${f.consommation_m3} m³`, '—', '1 400', f.montant_ht?.toLocaleString('fr-FR')],
        ['Redevance de renouvellement', '—', '2%', '—', f.montant_renouvellement?.toLocaleString('fr-FR')],
        ["Redevance d'assainissement", '—', '2%', '—', f.montant_assainissement?.toLocaleString('fr-FR')],
        ['Redevance de branchement social', '—', '2%', '—', f.montant_branchement?.toLocaleString('fr-FR')],
        ['Taxe & Surtaxe communales', '—', '2%', '—', f.montant_taxe_communale?.toLocaleString('fr-FR')],
        ['Sur-consommation (>10 m³)', '—', '20%', '—', f.montant_surconsommation?.toLocaleString('fr-FR')],
      ],
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [0, 119, 182], textColor: 255, fontStyle: 'bold' },
    })

    // Total
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    doc.setFillColor(0, 119, 182)
    doc.rect(120, finalY, 70, 18, 'F')
    doc.setTextColor(255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('MONTANT À PAYER', 125, finalY + 7)
    doc.setFontSize(14)
    doc.text(`${(f.total_ttc as number)?.toLocaleString('fr-FR')} Ar`, 125, finalY + 14)

    doc.save(`FACTURE_${f.numero_facture}_${c.nom_prenom}.pdf`)
  }

  return { factures, loading, fetchFactures, enregistrerPaiement, genererPdfFacture }
}

// composables/useRecapitulatif.ts
export function useRecapitulatif() {
  const supabase = useSupabaseClient()
  const auth = useAuthStore()

  async function fetchRecap(annee: number, mois: number) {
    const { data } = await supabase
      .from('vue_recapitulatif_mensuel')
      .select('*')
      .eq('annee', annee)
      .eq('mois', mois)
    return data ?? []
  }

  async function exporterExcel(annee: number, mois: number) {
    const { default: XLSX } = await import('xlsx')
    const { MOIS_NOMS } = await import('~/types')
    const data = await fetchRecap(annee, mois)

    const wb = XLSX.utils.book_new()
    const rows = [
      [`ACOGEMA — CONSOMMATION DU MOIS DE ${MOIS_NOMS[mois].toUpperCase()} ${annee}`],
      ['Evaluation de prix de consommation et Taxe à Beforona BP'],
      [],
      ['N°', 'Nom et Prénom', 'Consommation (m³)', 'Montant HT (Ar)', 'Redevances & Taxes (8%)', 'Sur-consommation', 'Total TTC (Ar)', 'Montant Payé (Ar)', 'Observations'],
      ...data.map((d: unknown, i: number) => {
        const r = d as Record<string, unknown>
        return [
          i + 1, r.nom_prenom, r.consommation_m3,
          r.montant_ht, r.total_redevances, r.montant_surconsommation,
          r.total_ttc, r.montant_paye, r.statut_paiement
        ]
      }),
      [],
      [
        '', 'TOTAL',
        data.reduce((s: number, d: unknown) => s + ((d as Record<string, unknown>).consommation_m3 as number ?? 0), 0),
        data.reduce((s: number, d: unknown) => s + ((d as Record<string, unknown>).montant_ht as number ?? 0), 0),
        data.reduce((s: number, d: unknown) => s + ((d as Record<string, unknown>).total_redevances as number ?? 0), 0),
        data.reduce((s: number, d: unknown) => s + ((d as Record<string, unknown>).montant_surconsommation as number ?? 0), 0),
        data.reduce((s: number, d: unknown) => s + ((d as Record<string, unknown>).total_ttc as number ?? 0), 0),
        data.reduce((s: number, d: unknown) => s + ((d as Record<string, unknown>).montant_paye as number ?? 0), 0),
      ]
    ]

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws, `ETAPE_3_${mois}_${annee}`)
    XLSX.writeFile(wb, `RECAPITULATIF_${MOIS_NOMS[mois]}_${annee}.xlsx`)

    await auth.logAudit('EXPORT', 'vue_recapitulatif_mensuel', undefined)
  }

  return { fetchRecap, exporterExcel }
}

// composables/useDashboard.ts
export function useDashboard() {
  const supabase = useSupabaseClient()
  const auth = useAuthStore()
  const stats = ref<unknown>(null)
  const chartData = ref<unknown[]>([])

  async function fetchStats(annee?: number, mois?: number) {
    if (!auth.agenceId) return
    const now = new Date()
    const y = annee ?? now.getFullYear()
    const m = mois ?? now.getMonth() + 1

    const [clients, factures, releves] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact' }).eq('agence_id', auth.agenceId).eq('is_active', true),
      supabase.from('factures').select('total_ttc, montant_paye, statut_paiement').eq('agence_id', auth.agenceId).eq('annee', y).eq('mois', m),
      supabase.from('releves').select('consommation').eq('agence_id', auth.agenceId).eq('annee', y).eq('mois', m),
    ])

    const facs = factures.data ?? []
    const totalFacture = facs.reduce((s: number, f: Record<string, unknown>) => s + (f.total_ttc as number), 0)
    const totalPaye = facs.reduce((s: number, f: Record<string, unknown>) => s + (f.montant_paye as number), 0)
    const impayees = facs.filter((f: Record<string, unknown>) => f.statut_paiement !== 'paye').length
    const montantImpaye = facs
      .filter((f: Record<string, unknown>) => f.statut_paiement !== 'paye')
      .reduce((s: number, f: Record<string, unknown>) => s + ((f.total_ttc as number) - (f.montant_paye as number)), 0)

    const totalConso = (releves.data ?? []).reduce((s: number, r: Record<string, unknown>) => s + (r.consommation as number), 0)

    stats.value = {
      total_clients: clients.count ?? 0,
      clients_actifs: clients.count ?? 0,
      consommation_mois: totalConso,
      revenus_factures: totalFacture,
      revenus_recouvres: totalPaye,
      taux_recouvrement: totalFacture > 0 ? Math.round((totalPaye / totalFacture) * 100) : 0,
      factures_impayees: impayees,
      montant_impaye: montantImpaye,
    }

    // Données graphique par mois
    const consosParMois = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        supabase.from('releves')
          .select('consommation')
          .eq('agence_id', auth.agenceId)
          .eq('annee', y)
          .eq('mois', i + 1)
      )
    )
    chartData.value = consosParMois.map((r, i) => ({
      mois: i + 1,
      consommation: (r.data ?? []).reduce((s: number, rel: Record<string, unknown>) => s + (rel.consommation as number), 0)
    }))
  }

  return { stats, chartData, fetchStats }
}

// composables/useImportExcel.ts
export function useImportExcel() {
  const { saisirEtFacturer } = useReleves()
  const supabase = useSupabaseClient()
  const auth = useAuthStore()

  async function importerEtape1(file: File): Promise<{ succes: number; erreurs: string[] }> {
    const { read, utils } = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const wb = read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = utils.sheet_to_json(ws, { header: 1 }) as unknown[][]

    let succes = 0
    const erreurs: string[] = []
    const headerRow = rows.findIndex((r) => r[0] === 'N°')
    if (headerRow < 0) return { succes: 0, erreurs: ['Format non reconnu: entête N° introuvable'] }

    // Extraire l'année du fichier
    const annee = new Date().getFullYear()

    for (const row of rows.slice(headerRow + 1)) {
      if (!row[0] || !row[1]) continue
      try {
        const clientRef = String(row[1]).trim()
        const { data: client } = await supabase
          .from('clients')
          .select('id, index_initial')
          .eq('agence_id', auth.agenceId)
          .ilike('nom_prenom', clientRef)
          .single()
        if (!client) { erreurs.push(`Client non trouvé: ${clientRef}`); continue }

        for (let m = 0; m < 12; m++) {
          const val = row[m + 2]
          if (val === null || val === undefined || val === '') continue
          const nouvelIndex = parseFloat(String(val))
          if (isNaN(nouvelIndex)) continue

          // Trouver l'ancien index (dernier relevé ou initial)
          const { data: dernierReleve } = await supabase
            .from('releves')
            .select('nouvel_index')
            .eq('client_id', client.id)
            .lt('mois', m + 1)
            .eq('annee', annee)
            .order('mois', { ascending: false })
            .limit(1)
            .single()

          const ancienIndex = dernierReleve?.nouvel_index ?? client.index_initial

          await saisirEtFacturer({
            client_id: client.id,
            annee,
            mois: m + 1,
            ancien_index: ancienIndex,
            nouvel_index: nouvelIndex,
            date_releve: new Date().toISOString().split('T')[0],
          })
          succes++
        }
      } catch (e) {
        erreurs.push(`Ligne ${row[0]}: ${(e as Error).message}`)
      }
    }
    return { succes, erreurs }
  }

  return { importerEtape1 }
}
