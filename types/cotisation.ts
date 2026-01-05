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
