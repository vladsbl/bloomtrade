import { Trade } from './trade';

export interface JournalDay {
  date: string;
  trades: Trade[];
  note: string;
}
