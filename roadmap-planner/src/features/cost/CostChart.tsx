// CostChart - D3.js bar/area chart for cost visualization

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { ChartType, CostPeriodData, StackBy } from './CostProfile';

// Colour palette for categories
const categoryColours = [
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#F59E0B', // amber-500
  '#10B981', // emerald-500
  '#EF4444', // red-500
  '#06B6D4', // cyan-500
  '#EC4899', // pink-500
  '#6366F1', // indigo-500
];

interface CostChartProps {
  data: CostPeriodData[];
  chartType: ChartType;
  stackBy: StackBy;
  categories: string[];
  budgetData: { key: string; budget: number; startDate: Date; endDate: Date }[];
}

export function CostChart({
  data,
  chartType,
  stackBy,
  categories,
  budgetData,
}: CostChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [showDataTable, setShowDataTable] = useState(false);
  const tableId = useId();
  const descId = useId();

  // Calculate total cost for description
  const totalCost = useMemo(() =>
    data.reduce((sum, d) => sum + d.totalCost, 0),
    [data]
  );

  // Get colour for category
  const colourScale = useMemo(() => {
    return d3.scaleOrdinal<string>()
      .domain(categories)
      .range(categoryColours);
  }, [categories]);

  // Chart description for screen readers
  const chartDescription = useMemo(() => {
    if (data.length === 0) return 'Empty cost chart';
    const firstPeriod = data[0]?.label ?? '';
    const lastPeriod = data[data.length - 1]?.label ?? '';
    return `${chartType === 'bar' ? 'Bar' : 'Area'} chart showing costs from ${firstPeriod} to ${lastPeriod}. Total cost: ${formatCurrency(totalCost)}. ${data.length} periods displayed.`;
  }, [data, chartType, totalCost]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);

    // Clear previous content
    svg.selectAll('*').remove();

    // Dimensions
    const margin = { top: 20, right: 80, bottom: 60, left: 80 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    // Add accessible title and description
    svg.append('title').text('Cost Profile Chart');
    svg.append('desc').text(chartDescription);

    // Create main group
    const g = svg
      .attr('width', container.clientWidth)
      .attr('height', container.clientHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.map((d) => d.key))
      .range([0, width])
      .padding(0.2);

    const maxCost = d3.max(data, (d) => d.totalCost) ?? 0;
    const yScale = d3.scaleLinear()
      .domain([0, maxCost * 1.1])
      .range([height, 0]);

    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat((d) => formatCurrency(d as number));

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .attr('aria-hidden', 'true')
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em')
      .style('font-size', '11px')
      .style('fill', '#6B7280');

    g.append('g')
      .attr('class', 'y-axis')
      .attr('aria-hidden', 'true')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#6B7280');

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('aria-hidden', 'true')
      .selectAll('line')
      .data(yScale.ticks(6))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#E5E7EB')
      .attr('stroke-dasharray', '3,3');

    if (chartType === 'bar') {
      if (stackBy === 'none') {
        // Simple bars with accessibility
        g.selectAll('.bar')
          .data(data)
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('role', 'img')
          .attr('aria-label', (d) => `${d.label}: ${formatCurrency(d.totalCost)}`)
          .attr('x', (d) => xScale(d.key) ?? 0)
          .attr('y', (d) => yScale(d.totalCost))
          .attr('width', xScale.bandwidth())
          .attr('height', (d) => height - yScale(d.totalCost))
          .attr('fill', categoryColours[0])
          .attr('rx', 4)
          .attr('tabindex', 0)
          .style('cursor', 'pointer')
          .on('mouseover', function () {
            d3.select(this).attr('opacity', 0.8);
          })
          .on('mouseout', function () {
            d3.select(this).attr('opacity', 1);
          })
          .on('focus', function () {
            d3.select(this).attr('stroke', '#1D4ED8').attr('stroke-width', 2);
          })
          .on('blur', function () {
            d3.select(this).attr('stroke', 'none');
          });
      } else {
        // Stacked bars
        const stack = d3.stack<CostPeriodData>()
          .keys(categories)
          .value((d, key) => d.breakdown[key] ?? 0);

        const stackedData = stack(data);

        g.selectAll('.layer')
          .data(stackedData)
          .enter()
          .append('g')
          .attr('class', 'layer')
          .attr('fill', (d) => colourScale(d.key))
          .selectAll('rect')
          .data((d) => d)
          .enter()
          .append('rect')
          .attr('role', 'img')
          .attr('aria-label', (d, i, nodes) => {
            const parentNode = nodes[i].parentNode as Element | null;
            const layerKey = parentNode ? (d3.select(parentNode).datum() as d3.Series<CostPeriodData, string>).key : 'unknown';
            const value = d[1] - d[0];
            return `${d.data.label}, ${layerKey}: ${formatCurrency(value)}`;
          })
          .attr('x', (d) => xScale(d.data.key) ?? 0)
          .attr('y', (d) => yScale(d[1]))
          .attr('height', (d) => yScale(d[0]) - yScale(d[1]))
          .attr('width', xScale.bandwidth())
          .attr('rx', 2)
          .attr('tabindex', 0)
          .style('cursor', 'pointer')
          .on('mouseover', function () {
            d3.select(this).attr('opacity', 0.8);
          })
          .on('mouseout', function () {
            d3.select(this).attr('opacity', 1);
          })
          .on('focus', function () {
            d3.select(this).attr('stroke', '#1D4ED8').attr('stroke-width', 2);
          })
          .on('blur', function () {
            d3.select(this).attr('stroke', 'none');
          });
      }
    } else {
      // Area chart
      if (stackBy === 'none') {
        const area = d3.area<CostPeriodData>()
          .x((d) => (xScale(d.key) ?? 0) + xScale.bandwidth() / 2)
          .y0(height)
          .y1((d) => yScale(d.totalCost))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(data)
          .attr('fill', categoryColours[0])
          .attr('fill-opacity', 0.6)
          .attr('d', area)
          .attr('aria-hidden', 'true');

        // Line on top
        const line = d3.line<CostPeriodData>()
          .x((d) => (xScale(d.key) ?? 0) + xScale.bandwidth() / 2)
          .y((d) => yScale(d.totalCost))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', categoryColours[0])
          .attr('stroke-width', 2)
          .attr('d', line)
          .attr('aria-hidden', 'true');

        // Add focusable points for keyboard navigation
        g.selectAll('.data-point')
          .data(data)
          .enter()
          .append('circle')
          .attr('class', 'data-point')
          .attr('role', 'img')
          .attr('aria-label', (d) => `${d.label}: ${formatCurrency(d.totalCost)}`)
          .attr('cx', (d) => (xScale(d.key) ?? 0) + xScale.bandwidth() / 2)
          .attr('cy', (d) => yScale(d.totalCost))
          .attr('r', 5)
          .attr('fill', categoryColours[0])
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .attr('tabindex', 0)
          .on('focus', function () {
            d3.select(this).attr('r', 8).attr('stroke', '#1D4ED8');
          })
          .on('blur', function () {
            d3.select(this).attr('r', 5).attr('stroke', '#fff');
          });
      } else {
        // Stacked area
        const stack = d3.stack<CostPeriodData>()
          .keys(categories)
          .value((d, key) => d.breakdown[key] ?? 0);

        const stackedData = stack(data);

        const area = d3.area<d3.SeriesPoint<CostPeriodData>>()
          .x((d) => (xScale(d.data.key) ?? 0) + xScale.bandwidth() / 2)
          .y0((d) => yScale(d[0]))
          .y1((d) => yScale(d[1]))
          .curve(d3.curveMonotoneX);

        g.selectAll('.area')
          .data(stackedData)
          .enter()
          .append('path')
          .attr('class', 'area')
          .attr('fill', (d) => colourScale(d.key))
          .attr('fill-opacity', 0.7)
          .attr('d', area)
          .attr('aria-hidden', 'true');
      }
    }

    // Budget line (if provided)
    if (budgetData.length > 0) {
      const budgetLine = d3.line<{ key: string; budget: number }>()
        .x((d) => (xScale(d.key) ?? 0) + xScale.bandwidth() / 2)
        .y((d) => yScale(d.budget))
        .curve(d3.curveStepAfter);

      // Map budget data to periods
      const mappedBudget = data.map((period) => {
        const matchingBudget = budgetData.find(
          (b) => period.startDate >= b.startDate && period.startDate <= b.endDate
        );
        return {
          key: period.key,
          budget: matchingBudget?.budget ?? 0,
        };
      });

      g.append('path')
        .datum(mappedBudget.filter((d) => d.budget > 0))
        .attr('fill', 'none')
        .attr('stroke', '#DC2626')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6,3')
        .attr('d', budgetLine)
        .attr('aria-hidden', 'true');

      // Budget label
      g.append('text')
        .attr('x', width - 5)
        .attr('y', yScale(mappedBudget[mappedBudget.length - 1]?.budget ?? 0) - 5)
        .attr('text-anchor', 'end')
        .attr('fill', '#DC2626')
        .attr('font-size', '10px')
        .attr('font-weight', 'medium')
        .text('Budget')
        .attr('aria-hidden', 'true');
    }

    // Legend
    if (stackBy !== 'none' && categories.length > 0) {
      const legend = g.append('g')
        .attr('transform', `translate(${width + 10}, 0)`)
        .attr('aria-hidden', 'true');

      categories.forEach((category, i) => {
        const legendRow = legend.append('g')
          .attr('transform', `translate(0, ${i * 20})`);

        legendRow.append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('rx', 2)
          .attr('fill', colourScale(category));

        legendRow.append('text')
          .attr('x', 18)
          .attr('y', 10)
          .attr('font-size', '10px')
          .attr('fill', '#374151')
          .text(category);
      });
    }
  }, [data, chartType, stackBy, categories, budgetData, colourScale, chartDescription]);

  return (
    <div className="flex flex-col h-full">
      {/* Screen reader toggle for data table */}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => setShowDataTable(!showDataTable)}
          aria-expanded={showDataTable}
          aria-controls={tableId}
          className="text-xs text-primary-600 hover:text-primary-800 underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          {showDataTable ? 'Hide data table' : 'Show data table'}
        </button>
      </div>

      {/* Accessible data table (toggle-able) */}
      {showDataTable && (
        <div id={tableId} className="mb-4 overflow-x-auto">
          <table className="min-w-full text-xs border border-gray-200">
            <caption className="sr-only">Cost data by period</caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium text-gray-700">Period</th>
                <th scope="col" className="px-3 py-2 text-right font-medium text-gray-700">Total Cost</th>
                {stackBy !== 'none' && categories.map(cat => (
                  <th key={cat} scope="col" className="px-3 py-2 text-right font-medium text-gray-700">{cat}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((row) => (
                <tr key={row.key}>
                  <td className="px-3 py-2 text-gray-900">{row.label}</td>
                  <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(row.totalCost)}</td>
                  {stackBy !== 'none' && categories.map(cat => (
                    <td key={cat} className="px-3 py-2 text-right text-gray-600">
                      {formatCurrency(row.breakdown[cat] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Chart container */}
      <div
        ref={containerRef}
        className="flex-1 min-h-[300px]"
        role="img"
        aria-label={chartDescription}
        aria-describedby={descId}
      >
        <p id={descId} className="sr-only">{chartDescription}</p>
        <svg
          ref={svgRef}
          className="w-full h-full"
          role="graphics-document"
          aria-roledescription="chart"
        />
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `£${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `£${(value / 1_000).toFixed(0)}K`;
  }
  return `£${value.toFixed(0)}`;
}
