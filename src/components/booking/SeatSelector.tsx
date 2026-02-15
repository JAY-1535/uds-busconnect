import { cn } from '@/lib/utils';

interface SeatSelectorProps {
  totalSeats: number;
  bookedSeats: number[];
  selectedSeat: number | null;
  onSelectSeat: (seat: number | null) => void;
}

export const SeatSelector = ({
  totalSeats,
  bookedSeats,
  selectedSeat,
  onSelectSeat,
}: SeatSelectorProps) => {
  // Standard bus layout: 4 seats per row (2 + aisle + 2)
  const rows = Math.ceil(totalSeats / 4);

  const getSeatStatus = (seatNumber: number) => {
    if (seatNumber > totalSeats) return 'empty';
    if (bookedSeats.includes(seatNumber)) return 'booked';
    if (selectedSeat === seatNumber) return 'selected';
    return 'available';
  };

  const handleSeatClick = (seatNumber: number) => {
    const status = getSeatStatus(seatNumber);
    if (status === 'available') {
      onSelectSeat(seatNumber);
    } else if (status === 'selected') {
      onSelectSeat(null); // Deselect
    }
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded seat-available" />
          <span className="text-sm text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded seat-selected" />
          <span className="text-sm text-muted-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded seat-taken" />
          <span className="text-sm text-muted-foreground">Booked</span>
        </div>
      </div>

      {/* Bus Layout */}
      <div className="bg-muted/50 rounded-2xl p-6 max-w-md mx-auto">
        {/* Driver Area */}
        <div className="flex justify-between items-center mb-6 px-4">
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
            BUS
          </div>
          <div className="text-xs text-muted-foreground">Front</div>
        </div>

        {/* Seats Grid */}
        <div className="space-y-2">
          {Array.from({ length: rows }, (_, rowIndex) => {
            const leftSeats = [rowIndex * 4 + 1, rowIndex * 4 + 2];
            const rightSeats = [rowIndex * 4 + 3, rowIndex * 4 + 4];

            return (
              <div key={rowIndex} className="flex items-center justify-center gap-8">
                {/* Left Column (2 seats) */}
                <div className="flex gap-2">
                  {leftSeats.map((seatNum) => {
                    const status = getSeatStatus(seatNum);
                    if (status === 'empty') {
                      return <div key={seatNum} className="w-10 h-10" />;
                    }
                    return (
                      <button
                        key={seatNum}
                        onClick={() => handleSeatClick(seatNum)}
                        disabled={status === 'booked'}
                        className={cn(
                          'w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-200',
                          status === 'available' && 'seat-available',
                          status === 'selected' && 'seat-selected',
                          status === 'booked' && 'seat-taken'
                        )}
                      >
                        {seatNum}
                      </button>
                    );
                  })}
                </div>

                {/* Aisle */}
                <div className="w-6" />

                {/* Right Column (2 seats) */}
                <div className="flex gap-2">
                  {rightSeats.map((seatNum) => {
                    const status = getSeatStatus(seatNum);
                    if (status === 'empty') {
                      return <div key={seatNum} className="w-10 h-10" />;
                    }
                    return (
                      <button
                        key={seatNum}
                        onClick={() => handleSeatClick(seatNum)}
                        disabled={status === 'booked'}
                        className={cn(
                          'w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-200',
                          status === 'available' && 'seat-available',
                          status === 'selected' && 'seat-selected',
                          status === 'booked' && 'seat-taken'
                        )}
                      >
                        {seatNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Back Label */}
        <div className="text-center mt-4 text-xs text-muted-foreground">Back</div>
      </div>
    </div>
  );
};




