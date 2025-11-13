import React, { useMemo, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import widgetsConfig from '../widgets/widgetsConfig.jsx';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const createLayout = (cols) =>
  widgetsConfig.map((widget, index) => ({
    i: widget.id,
    x: (index * widget.defaultWidth) % cols,
    y: Math.floor((index * widget.defaultWidth) / cols) * widget.defaultHeight,
    w: Math.min(widget.defaultWidth, cols),
    h: widget.defaultHeight,
    minW: 1,
    minH: 2
  }));

function Dashboard() {
  const [layouts, setLayouts] = useState(() => ({
    lg: createLayout(4),
    md: createLayout(4),
    sm: createLayout(2),
    xs: createLayout(1),
    xxs: createLayout(1)
  }));

  const widgetLookup = useMemo(() => {
    const map = new Map();
    widgetsConfig.forEach((widget) => map.set(widget.id, widget));
    return map;
  }, []);

  const renderWidget = (layoutItem) => {
    const widget = widgetLookup.get(layoutItem.i);
    if (!widget) return null;
    const WidgetComponent = widget.component;
    const isExpanded = layoutItem.h >= 3;
    return <WidgetComponent isExpanded={isExpanded} layoutItem={layoutItem} />;
  };

  const currentLayout = layouts.lg || [];

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      rowHeight={120}
      cols={{ lg: 4, md: 4, sm: 2, xs: 1, xxs: 1 }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      onLayoutChange={(layout, allLayouts) => setLayouts(allLayouts)}
      draggableHandle=".widget-header"
    >
      {currentLayout.map((layoutItem) => (
        <div key={layoutItem.i} data-grid={layoutItem}>
          <div className="widget-card">{renderWidget(layoutItem)}</div>
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}

export default Dashboard;
