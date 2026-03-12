// composables/useExcelExport.js
export function useExcelExport() {
  
  const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin',
                     'Juillet','Août','Septembre','Octobre','Novembre','Décembre']

  async function exportRecapConsommations(data, mois, annee) {
    const XLSX = await import('xlsx')
    
    const ws_data = [
      ['ACOGEMA - CONSOMMATION DU MOIS DE ' + MOIS_NOMS[mois-1].toUpperCase() + ' ' + annee],
      ['Evaluation de prix de consommation et Taxe'],
      [],
      ['N°', 'Nom et Prénom', 'Consommation (m³)', 'Montant HT (Ar)', 
       'Redevances & Taxes (8%)', 'Sur-consommation', 'Montant TTC (Ar)', 
       'Montant Payé (Ar)', 'Statut', 'Observations'],
    ]

    let totalConso = 0, totalHT = 0, totalRedv = 0, totalSurco = 0, totalTTC = 0, totalPaye = 0

    data.forEach((row, i) => {
      const conso = row.consommation || 0
      const ht = row.montant_ht || 0
      const redv = (row.redevance_renouvellement || 0) + (row.redevance_assainissement || 0) + 
                   (row.redevance_branchement || 0) + (row.taxe_communale || 0)
      const surco = row.surconsommation || 0
      const ttc = row.montant_ttc || 0
      const paye = row.montant_paye || 0
      
      totalConso += conso; totalHT += ht; totalRedv += redv; totalSurco += surco
      totalTTC += ttc; totalPaye += paye

      ws_data.push([
        i + 1, row.nom_prenom, conso, ht, redv, surco, ttc, paye, row.statut || '-', row.observation || ''
      ])
    })

    ws_data.push([])
    ws_data.push(['', 'TOTAL', totalConso, totalHT, totalRedv, totalSurco, totalTTC, totalPaye])

    const ws = XLSX.utils.aoa_to_sheet(ws_data)
    
    // Column widths
    ws['!cols'] = [
      {wch:4},{wch:30},{wch:18},{wch:18},{wch:20},{wch:18},{wch:18},{wch:18},{wch:12},{wch:25}
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Recap ${MOIS_NOMS[mois-1]} ${annee}`)
    XLSX.writeFile(wb, `ACOGEMA_Recap_${MOIS_NOMS[mois-1]}_${annee}.xlsx`)
  }

  async function exportRelevesAnnuels(data, annee) {
    const XLSX = await import('xlsx')
    
    const ws_data = [
      ['ACOGEMA - RELEVÉ ANNUEL ' + annee],
      ['MAROVOALAVO'],
      [],
      ['N°', 'Noms', 'Réf Compteur', ...MOIS_NOMS],
    ]

    data.forEach(row => {
      ws_data.push([
        row.numero, row.nom_prenom, row.ref_compteur || '',
        row.janvier, row.fevrier, row.mars, row.avril,
        row.mai, row.juin, row.juillet, row.aout,
        row.septembre, row.octobre, row.novembre, row.decembre
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet(ws_data)
    ws['!cols'] = [
      {wch:4},{wch:30},{wch:15},
      ...Array(12).fill({wch:12})
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Relevés ${annee}`)
    XLSX.writeFile(wb, `ACOGEMA_Releves_${annee}.xlsx`)
  }

  async function exportFactures(factures, mois, annee) {
    const XLSX = await import('xlsx')
    const moisNom = MOIS_NOMS[mois-1]

    const ws_data = [
      ['ACOGEMA - FACTURES ' + moisNom.toUpperCase() + ' ' + annee],
      [],
      ['N° Facture', 'Client', 'Catégorie', 'Conso (m³)', 'Montant HT', 
       'Redevances', 'Sur-conso', 'Total TTC', 'Statut', 'Date Paiement'],
    ]

    factures.forEach(f => {
      ws_data.push([
        f.numero_facture,
        f.client?.nom_prenom || '',
        f.client?.categorie || '',
        f.consommation_m3,
        f.montant_ht,
        (f.redevance_renouvellement||0) + (f.redevance_assainissement||0) + 
        (f.redevance_branchement||0) + (f.taxe_communale||0),
        f.surconsommation || 0,
        f.montant_ttc,
        f.statut,
        f.date_paiement ? new Date(f.date_paiement).toLocaleDateString('fr-FR') : ''
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet(ws_data)
    ws['!cols'] = Array(10).fill({wch:16})
    ws['!cols'][1] = {wch:30}

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Factures ${moisNom}`)
    XLSX.writeFile(wb, `ACOGEMA_Factures_${moisNom}_${annee}.xlsx`)
  }

  return { exportRecapConsommations, exportRelevesAnnuels, exportFactures, MOIS_NOMS }
}
