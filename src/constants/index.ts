export enum SMS_STATUS {
  PENDING = "pending",
  APPROVED = "approved",
}

export enum ORDER_STATUS {
  CREATED = 'created', //-> default
  PENDING = 'pending', //-> payment has been made
  PAID = 'paid' //->webhook has been sent and payment has been confirmed
}

export const uoms = [
  { id: 1, name: 'Portion' },
  { id: 2, name: 'Plate' },
  { id: 3, name: 'Piece' },
  { id: 4, name: 'Serving' },
  { id: 5, name: 'Slice' }
];
