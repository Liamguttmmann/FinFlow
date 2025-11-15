import GoalsWidget from './GoalsWidget.jsx';
import PlaceholderWidget from './PlaceholderWidget.jsx';

const widgetsConfig = [
  {
    id: 'totalIncome',
    title: 'Total Income',
    component: (props) => <PlaceholderWidget {...props} title="Total Income" value="R$ 12.500" trend="12%" />,
    defaultWidth: 2,
    defaultHeight: 2
  },
  {
    id: 'totalExpense',
    title: 'Total Expense',
    component: (props) => <PlaceholderWidget {...props} title="Total Expense" value="R$ 8.230" trend="5%" inverted />,
    defaultWidth: 2,
    defaultHeight: 2
  },
  {
    id: 'goalsWidget',
    title: 'Metas de gastos',
    component: GoalsWidget,
    defaultWidth: 2,
    defaultHeight: 2
  }
];

export default widgetsConfig;
