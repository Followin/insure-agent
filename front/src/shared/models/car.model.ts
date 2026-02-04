export interface CarDto {
  id: number;
  chassis: string;
  make: string;
  model: string;
  registration: string;
  plate: string;
  year: number;
  engine_displacement_litres: number;
  mileage_km: number;
  unladen_weight: number;
  laden_weight: number;
  seats: number;
}

export type CreateCarDto = Omit<CarDto, 'id'>;

// === Car Reference (matches backend CarRef) ===

export type CarRefExisting = {
  kind: 'Existing';
  id: number;
};

export type CarRefNew = {
  kind: 'New';
} & CreateCarDto;

export type CarRef = CarRefExisting | CarRefNew;
