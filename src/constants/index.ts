export enum SMS_STATUS {
  PENDING = 'pending',
  APPROVED = 'approved'
}

export enum ORDER_STATUS {
  CREATED = 'created', //-> default
  PENDING = 'pending', //-> payment has been made
  IN_INPROGRES = 'in-progres',
  PAID = 'paid', //->webhook has been sent and payment has been confirmed
  COMPLETED = 'completed'
}

export const uoms = [
  { id: 1, name: 'Portion' },
  { id: 2, name: 'Plate' },
  { id: 3, name: 'Piece' },
  { id: 4, name: 'Serving' },
  { id: 5, name: 'Slice' }
];

export const uomMap = uoms.reduce((map, uom) => {
  map[uom.id] = uom.name;
  return map;
}, {});
