export enum SMS_STATUS {
  PENDING = 'pending',
  APPROVED = 'approved'
}

export enum ORDER_STATUS {
  CREATED = 'created', //-> default
  PENDING = 'pending', //-> payment has been made
  // IN_PROGRESS = 'in-progress',
  PAID = 'paid', //->webhook has been sent and payment has been confirmed
  DELIVERING = 'delivering',
  COMPLETED = 'completed'
}

export enum DELIVERY_NOTES_STATUS {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  DISPATCHED = 'dispatched',
  DELIVERED = 'delivered'
}

export enum DELIVERY_TRIPS_STATUS {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DISPATCHED = 'dispatched',
  REJECTED = 'rejected',
  DELIVERED = 'delivered',
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
