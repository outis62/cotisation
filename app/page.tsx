'use client';

import React, { useState } from 'react';
import { Calendar, CheckCircle } from 'lucide-react';

export interface Paiement {
  date: string;
  montant: number;
  timestamp: string;
}

export interface Personne {
  id: number;
  nom: string;
  paiements: Record<string, Paiement>;
}

export interface CotisationState {
  personnes: Personne[];
  selectedMonth: number;
  selectedYear: number;
}

export default function CotisationTracker() {
  const MONTANT_JOURNALIER = 1000;
  const AVANCE_MAX_JOURS = 3;

  const [personnes, setPersonnes] = useState<Personne[]>([
    { id: 1, nom: 'Boureima Zabre', paiements: {} },
    { id: 2, nom: 'Idrissa Sawadogo', paiements: {} }
  ]);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear] = useState<number>(new Date().getFullYear());

  /* =======================
     UTILS
  ======================= */

  const getDaysInMonth = (month: number, year: number): number[] =>
    Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1);

  const getDateKey = (day: number, month: number, year: number): string =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getPreviousDateKey = (day: number, month: number, year: number): string | null => {
    const prev = new Date(year, month, day - 1);
    if (prev.getMonth() !== month) return null;
    return getDateKey(prev.getDate(), month, year);
  };

  const isDateInFuture = (day: number, month: number, year: number): boolean => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const canPayInAdvance = (day: number, month: number, year: number): boolean => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= AVANCE_MAX_JOURS;
  };

  /* =======================
     TOGGLE PAIEMENT
     - Interdit décocher
     - Respect séquentialité
  ======================= */

  const togglePaiement = (personneId: number, day: number) => {
    const dateKey = getDateKey(day, selectedMonth, selectedYear);

    // Vérifier date future / avance max
    if (isDateInFuture(day, selectedMonth, selectedYear) && !canPayInAdvance(day, selectedMonth, selectedYear)) {
      return;
    }

    setPersonnes(prev =>
      prev.map(p => {
        if (p.id !== personneId) return p;

        const newPaiements = { ...p.paiements };
        const isPaid = !!newPaiements[dateKey];

        // 🔒 Interdit décocher
        if (isPaid) return p;

        // ⛔ Vérifier séquentialité
        const prevKey = getPreviousDateKey(day, selectedMonth, selectedYear);
        if (prevKey && !newPaiements[prevKey]) return p;

        // ✅ Ajouter le paiement
        newPaiements[dateKey] = {
          date: dateKey,
          montant: MONTANT_JOURNALIER,
          timestamp: new Date().toISOString()
        };

        return { ...p, paiements: newPaiements };
      })
    );
  };

  /* =======================
     CALCUL STATS
  ======================= */

  const calculateStats = (personne: Personne) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let joursEchus = 0;
    let joursPayes = 0;
    let retards = 0;
    let avances = 0;

    for (let month = 0; month <= selectedMonth; month++) {
      getDaysInMonth(month, selectedYear).forEach(day => {
        const dateKey = getDateKey(day, month, selectedYear);
        const date = new Date(selectedYear, month, day);

        if (date <= today) {
          joursEchus++;
          if (personne.paiements[dateKey]) joursPayes++;
          else retards++;
        } else if (personne.paiements[dateKey]) {
          avances++;
        }
      });
    }

    const montantRetard = retards * MONTANT_JOURNALIER;
    const montantPaye = joursPayes * MONTANT_JOURNALIER;
    const montantAvance = avances * MONTANT_JOURNALIER;
    const totalAttenduAnnee = 365 * MONTANT_JOURNALIER;
    const progression = ((joursPayes / joursEchus) * 100).toFixed(1);

    return {
      joursEchus,
      joursPayes,
      retards,
      avances,
      montantRetard,
      montantPaye,
      montantAvance,
      totalAttenduAnnee,
      progression: isNaN(Number(progression)) ? 0 : Number(progression)
    };
  };

  /* =======================
     RENDER
  ======================= */

  const days = getDaysInMonth(selectedMonth, selectedYear);
  const today = new Date();
  const monthNames = [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">

        {/* STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {personnes.map(p => {
            const pStats = calculateStats(p);
            return (
              <div key={p.id} className="bg-white rounded-lg shadow-lg p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${p.id === 1 ? 'bg-indigo-500' : 'bg-purple-500'}`}></span>
                  {p.nom}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Progression</p>
                    <p className="text-xl font-bold text-indigo-600">{pStats.progression}%</p>
                    <p className="text-xs text-gray-500">{pStats.joursPayes}/{pStats.joursEchus} jours</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Retards</p>
                    <p className="text-xl font-bold text-red-600">{pStats.retards}</p>
                    <p className="text-xs text-gray-500">{pStats.montantRetard.toLocaleString()} CFA</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Avances</p>
                    <p className="text-xl font-bold text-green-600">{pStats.avances}</p>
                    <p className="text-xs text-gray-500">{pStats.montantAvance.toLocaleString()} CFA</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Total payé</p>
                    <p className="text-xl font-bold text-blue-600">{(pStats.montantPaye / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-gray-500">sur {(pStats.totalAttenduAnnee / 1000).toFixed(0)}K CFA</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CALENDRIER */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{monthNames[selectedMonth]} {selectedYear}</h2>

          <div className="grid grid-cols-7 gap-2">
            {['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">{day}</div>
            ))}
            {Array(new Date(selectedYear, selectedMonth, 1).getDay()).fill(null).map((_, i) => <div key={`empty-${i}`} />)}

            {days.map(day => {
              const dateKey = getDateKey(day, selectedMonth, selectedYear);
              const date = new Date(selectedYear, selectedMonth, day);
              const isToday = date.toDateString() === today.toDateString();
              const isFuture = isDateInFuture(day, selectedMonth, selectedYear);
              const canAdvance = canPayInAdvance(day, selectedMonth, selectedYear);
              const isPast = date < today && !isToday;

              const personne1Paid = personnes[0].paiements[dateKey];
              const personne2Paid = personnes[1].paiements[dateKey];
              const bothPaid = personne1Paid && personne2Paid;
              const nonePaid = !personne1Paid && !personne2Paid;

              let bgColor = 'bg-gray-50';
              let textColor = 'text-gray-700';
              let borderColor = 'border-gray-200';

              if (bothPaid && isFuture) {
                bgColor = 'bg-green-100';
                textColor = 'text-green-800';
                borderColor = 'border-green-300';
              } else if (bothPaid) {
                bgColor = 'bg-blue-100';
                textColor = 'text-blue-800';
                borderColor = 'border-blue-300';
              } else if (nonePaid && isPast) {
                bgColor = 'bg-red-100';
                textColor = 'text-red-800';
                borderColor = 'border-red-300';
              } else if (!nonePaid && isPast) {
                bgColor = 'bg-orange-100';
                textColor = 'text-orange-800';
                borderColor = 'border-orange-300';
              } else if (canAdvance) {
                bgColor = 'bg-yellow-50';
                borderColor = 'border-yellow-300';
              } else if (isFuture) {
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-400';
              }

              const isClickable = !isFuture || canAdvance;

              return (
                <div
                  key={day}
                  className={`
                    relative p-2 rounded-lg border-2 transition-all
                    ${bgColor} ${textColor} ${borderColor}
                    ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                  `}
                >
                  <div className="text-center text-lg font-semibold mb-1">{day}</div>

                  <div className="flex flex-col gap-1">
                    {personnes.map(p => {
                      const isPaid = !!p.paiements[dateKey];
                      const prevKey = getPreviousDateKey(day, selectedMonth, selectedYear);
                      const canClick = !isPaid && (!prevKey || !!p.paiements[prevKey]) && isClickable;

                      return (
                        <button
                          key={p.id}
                          onClick={() => canClick && togglePaiement(p.id, day)}
                          disabled={!canClick}
                          className={`
                            flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all
                            ${isPaid 
                              ? 'bg-green-500 text-white hover:bg-green-600' 
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'}
                            ${!canClick ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                          `}
                        >
                          <div className={`w-3 h-3 rounded border-2 flex items-center justify-center ${
                            isPaid ? 'bg-white border-white' : 'border-gray-400'
                          }`}>
                            {isPaid && <CheckCircle className="w-2.5 h-2.5 text-green-500" />}
                          </div>
                          <span className="truncate">{p.nom.split(' ')[1]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {isToday && <div className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
