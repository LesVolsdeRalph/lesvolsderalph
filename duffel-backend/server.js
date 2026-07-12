require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY;
const DUFFEL_BASE_URL = 'https://api.duffel.com';
const DUFFEL_VERSION = 'v2';

if (!DUFFEL_API_KEY) {
  console.warn('⚠️  DUFFEL_API_KEY manquante — copie .env.example en .env et renseigne ta clé.');
}

/**
 * POST /api/search
 * Body attendu (envoyé par le formulaire du site) :
 * {
 *   origin: "CDG",
 *   destination: "DSS",
 *   departDate: "2026-09-10",
 *   returnDate: "2026-09-24",   // optionnel si aller simple
 *   roundTrip: true,
 *   passengers: 1,
 *   cabinClass: "economy"       // economy | premium_economy | business | first
 * }
 */
app.post('/api/search', async (req, res) => {
  try {
    const {
      origin,
      destination,
      departDate,
      returnDate,
      roundTrip,
      passengers = 1,
      cabinClass = 'economy'
    } = req.body;

    if (!origin || !destination || !departDate) {
      return res.status(400).json({ error: 'origin, destination et departDate sont requis.' });
    }

    // Construction des tronçons (slices) : aller, + retour si aller-retour
    const slices = [
      { origin, destination, departure_date: departDate }
    ];
    if (roundTrip && returnDate) {
      slices.push({ origin: destination, destination: origin, departure_date: returnDate });
    }

    const passengerList = Array.from({ length: Number(passengers) || 1 }, () => ({ type: 'adult' }));

    const duffelResponse = await fetch(`${DUFFEL_BASE_URL}/air/offer_requests?return_offers=true`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_KEY}`,
        'Duffel-Version': DUFFEL_VERSION,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        data: {
          slices,
          passengers: passengerList,
          cabin_class: cabinClass
        }
      })
    });

    const payload = await duffelResponse.json();

    if (!duffelResponse.ok) {
      console.error('Erreur Duffel:', JSON.stringify(payload, null, 2));
      return res.status(duffelResponse.status).json({
        error: payload.errors?.[0]?.message || 'Erreur lors de la recherche Duffel.'
      });
    }

    // On simplifie la réponse pour ne renvoyer que ce dont le site a besoin
    const offers = (payload.data.offers || []).map(offer => ({
      id: offer.id,
      totalAmount: offer.total_amount,
      totalCurrency: offer.total_currency,
      airline: offer.owner?.name,
      airlineLogo: offer.owner?.logo_symbol_url,
      slices: offer.slices.map(slice => ({
        origin: slice.origin?.iata_code,
        destination: slice.destination?.iata_code,
        duration: slice.duration,
        segments: slice.segments.map(seg => ({
          airline: seg.marketing_carrier?.name,
          flightNumber: seg.marketing_carrier_flight_number,
          departingAt: seg.departing_at,
          arrivingAt: seg.arriving_at,
          origin: seg.origin?.iata_code,
          destination: seg.destination?.iata_code
        })),
        stops: slice.segments.length - 1
      }))
    }));

    // Tri par prix croissant — celui qui "défie la concurrence" en premier
    offers.sort((a, b) => parseFloat(a.totalAmount) - parseFloat(b.totalAmount));

    res.json({ offers });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la recherche de vols.' });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Serveur Les Vols de Ralph lancé sur http://localhost:${PORT}`);
});
