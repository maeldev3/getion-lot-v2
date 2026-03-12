// composables/useFacturePDF.js
export function useFacturePDF() {
  
  function formatMontant(val) {
    if (!val && val !== 0) return '0'
    return Math.round(val).toLocaleString('fr-FR') + ' Ar'
  }

  function formatMois(mois, annee) {
    const noms = ['Janvier','Février','Mars','Avril','Mai','Juin',
                  'Juillet','Août','Septembre','Octobre','Novembre','Décembre']
    return `${noms[mois - 1]} ${annee}`
  }

  async function generateFacturePDF(facture, client, agence = null) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })

    const W = doc.internal.pageSize.getWidth()
    const H = doc.internal.pageSize.getHeight()
    
    // Colors
    const bleu = [14, 165, 233]
    const dark = [15, 23, 42]
    const grey = [100, 116, 139]
    const lightGrey = [241, 245, 249]

    // ---- HEADER ----
    doc.setFillColor(...dark)
    doc.rect(0, 0, W, 28, 'F')

    doc.setFillColor(...bleu)
    doc.rect(0, 0, 4, 28, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('ACOGEMA', 10, 10)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text(agence?.name || 'Agence Beforona', 10, 16)
    doc.text(agence?.phone || '038 10 457 38', 10, 21)
    doc.text(agence?.email || 'rehasajp@yahoo.com', 10, 26)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('FACTURE', W - 10, 10, { align: 'right' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text(`N° ${facture.numero_facture}`, W - 10, 16, { align: 'right' })
    doc.text(formatMois(facture.mois, facture.annee), W - 10, 21, { align: 'right' })

    // ---- CLIENT INFO ----
    let y = 35
    doc.setFillColor(...lightGrey)
    doc.roundedRect(5, y, W - 10, 24, 2, 2, 'F')

    doc.setTextColor(...dark)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('DOIT :', 9, y + 7)
    doc.setFontSize(11)
    doc.text(client.nom_prenom || '', 9, y + 14)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...grey)
    doc.text(`Fokontany : ${client.fokontany || '-'}`, 9, y + 20)
    doc.text(`Catégorie : ${client.categorie || 'BP'}`, W/2, y + 7)
    doc.text(`Réf. Client : ${client.ref_client || '-'}`, W/2, y + 13)
    doc.text(`Code Client : ${client.code_client || '-'}`, W/2, y + 19)
    doc.text(`Réf. Compteur : ${client.ref_compteur || '-'}`, W/2, y + 25)

    // ---- INDEX ----
    y = 65
    doc.setTextColor(...dark)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Consommation du mois de : ' + formatMois(facture.mois, facture.annee), 5, y)

    y += 7
    const releve = facture.releve || {}
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...grey)
    doc.text('Ancien Index :', 5, y)
    doc.setTextColor(...dark)
    doc.text((releve.ancien_index || '-') + ' m³', 50, y)
    y += 5
    doc.setTextColor(...grey)
    doc.text('Nouvel Index :', 5, y)
    doc.setTextColor(...dark)
    doc.text((releve.nouvel_index || '-') + ' m³', 50, y)
    y += 5
    doc.setTextColor(...grey)
    doc.text('Consommation :', 5, y)
    doc.setTextColor(...bleu)
    doc.setFont('helvetica', 'bold')
    doc.text((facture.consommation_m3 || 0) + ' m³', 50, y)

    // ---- DETAIL TABLE ----
    y += 10
    doc.setFillColor(...dark)
    doc.rect(5, y, W - 10, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text('DÉTAIL DE LA FACTURE', 8, y + 4)
    doc.text('MONTANT (Ar)', W - 8, y + 4, { align: 'right' })

    const rows = [
      ['Consommation Hors Taxe', facture.consommation_m3 + ' m³ × 1 400 Ar', facture.montant_ht],
      ['Redevance Renouvellement (2%)', '', facture.redevance_renouvellement],
      ["Redevance Assainissement (2%)", '', facture.redevance_assainissement],
      ['Redevance Branchement Social (2%)', '', facture.redevance_branchement],
      ['Taxe et Surtaxe Communales (2%)', '', facture.taxe_communale],
    ]
    if (facture.surconsommation > 0) {
      rows.push(['Sur-consommation (20%)', `>${10} m³`, facture.surconsommation])
    }

    y += 7
    rows.forEach((row, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(5, y, W - 10, 6, 'F')
      }
      doc.setTextColor(...dark)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.text(row[0], 8, y + 4)
      doc.setTextColor(...grey)
      doc.text(row[1], W/2, y + 4)
      doc.setTextColor(...dark)
      doc.text(formatMontant(row[2]), W - 8, y + 4, { align: 'right' })
      y += 6
    })

    // Total
    y += 2
    doc.setFillColor(...bleu)
    doc.roundedRect(5, y, W - 10, 9, 1.5, 1.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL TTC', 8, y + 6)
    doc.text(formatMontant(facture.montant_ttc), W - 8, y + 6, { align: 'right' })

    // ---- PAYMENT STATUS ----
    y += 14
    const statutColors = {
      PAYEE: [16, 185, 129],
      IMPAYEE: [239, 68, 68],
      PARTIELLE: [245, 158, 11],
    }
    const sc = statutColors[facture.statut] || grey
    doc.setFillColor(sc[0], sc[1], sc[2], 0.1)
    doc.setDrawColor(...sc)
    doc.setLineWidth(0.5)
    doc.roundedRect(5, y, W - 10, 8, 1.5, 1.5, 'D')
    doc.setTextColor(...sc)
    doc.setFontSize(8.5)
    doc.text('Statut : ' + facture.statut, 8, y + 5.5)
    if (facture.statut === 'PARTIELLE') {
      doc.text('Reste à payer : ' + formatMontant((facture.montant_ttc || 0) - (facture.montant_paye || 0)), W - 8, y + 5.5, { align: 'right' })
    }

    // Date limite
    y += 12
    if (facture.date_limite) {
      doc.setTextColor(...grey)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'italic')
      doc.text(`Date limite de paiement : ${facture.date_limite}`, 5, y)
    }

    // Footer
    doc.setFillColor(...dark)
    doc.rect(0, H - 12, W, 12, 'F')
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text('ACOGEMA - Gestion de l\'Eau', W / 2, H - 5, { align: 'center' })

    return doc
  }

  async function downloadFacture(facture, client, agence) {
    const doc = await generateFacturePDF(facture, client, agence)
    doc.save(`Facture_${facture.numero_facture}_${client.nom_prenom}.pdf`)
  }

  async function printFacture(facture, client, agence) {
    const doc = await generateFacturePDF(facture, client, agence)
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return { generateFacturePDF, downloadFacture, printFacture, formatMontant, formatMois }
}
