// HeatmapLegend - Colour scale legend for the resource heatmap

interface HeatmapLegendProps {
  overThreshold: number;
}

export function HeatmapLegend({ overThreshold }: HeatmapLegendProps) {
  const legendItems = [
    { colour: '#F3F4F6', label: '0%', description: 'No demand' },
    { colour: '#86EFAC', label: '1-70%', description: 'Under capacity' },
    { colour: '#FCD34D', label: `71-${overThreshold}%`, description: 'Near capacity' },
    { colour: '#F87171', label: `${overThreshold + 1}-100%`, description: 'At capacity' },
    { colour: '#991B1B', label: '>100%', description: 'Over capacity' },
  ];

  return (
    <div className="mt-4 flex items-center justify-center gap-6 py-3 bg-gray-50 rounded-lg">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Utilisation
      </span>
      <div className="flex items-center gap-4">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded-sm border border-gray-300"
              style={{ backgroundColor: item.colour }}
            />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
