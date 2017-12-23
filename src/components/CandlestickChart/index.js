import React       from "react"
import PropTypes   from "prop-types"
import moment      from "moment"
import createPlotlyComponent from "react-plotlyjs"
import Plotly      from "plotly.js/dist/plotly-cartesian"		

const PlotlyComponent = createPlotlyComponent(Plotly);

/**
 * Wrap a Plotly candlestick (error bars) chart into a React component
 */
export default class CandlestickChart extends React.Component
{
    static propTypes = {
        resources: PropTypes.arrayOf(PropTypes.object),
	targetObservation: PropTypes.string
    };

    constructor(props) {
        super(props);
        this.state = {
            chartName: this.props.targetObservation.replace(/ /g, '_')	// Replace spaces with underscores
        }
    }

    updateChartWidth() {
	Array.prototype.forEach.call(document.getElementsByClassName(this.state.chartName), plot => {
	    plot.style.width = "100%";
	    Plotly.Plots.resize(plot);
	})
    }

    // Should be some more "React-like" way to do this...
    componentDidMount() {
	window.addEventListener('resize', this.updateChartWidth.bind(this));
    }

    componentWillUnmount() {
	window.removeEventListener('resize', this.updateChartWidth);
    }

    render()
    {
	let selectedItemsSorted = this.props.resources.sort((a, b) => moment(a.effectiveDateTime) - moment(b.effectiveDateTime));
	let dates = selectedItemsSorted.map(item => item.effectiveDateTime);
	let values1 = selectedItemsSorted.map(item => item.component[0].valueQuantity.value.toFixed(1));
	let values2 = selectedItemsSorted.map(item => item.component[1] != undefined ? item.component[1].valueQuantity.value.toFixed(1) : undefined);
	let combined = dates.map((item, i) => ({date:item, value1:values1[i], value2:(values2 != undefined) ? values2[i] : undefined}));
	let isSingleValue = values1.length == 1;
	let isDoubleValue = values1.length == 2;
	let unit = selectedItemsSorted[0].component[0].valueQuantity.unit;

	let data = [
	    {
		type: 'scatter',
		x: dates,
		y: values1.map((val, index) => (Number(val) + Number(values2[index]))/2),
		error_y: {
		    type: 'data',
		    array: values1.map((val, index) => (Number(val) - Number(values2[index]))/2),
		    visible: true
		},
		marker: {
		    color: 'rgb(16, 32, 77)',
		    opacity: 0
		},
		line: {
		    width: 0
		},
		// Show systolic + diastolic + date on one hover text item
		hoverinfo: 'text',
		hovertext: combined.map(item => 'Systolic:  '  + item.value1 + ' ' + unit + '<br>' +
						'Diastolic: ' + item.value2 + ' ' + unit + '<br>(' +
						moment(item.date).format("D MMM YYYY")+ ')')
	    },
	];

	let layout = {
	    title: this.props.targetObservation.includes("Blood Pressure") ? "Blood Pressure" : this.props.targetObservation,
	    xaxis: {
		title: 'Date',
		// If only one/two data point(s), setup x-axis with "correct" tick values, tick format, and date range
		tickformat: isSingleValue|isDoubleValue ? '%Y' : '',
		// Example for tickvals for '2017-xx-xx': [ '2017-01-01', '2018-01-01' ]
		tickvals: isSingleValue ? [ moment(dates[0]).format("YYYY-01-01"),
					    moment(dates[0]).add(1,"years").format("YYYY-01-01") ]
					: undefined,
		// Example for range for '2017-xx-xx': [ '2016-12-01', '2018-02-01' ]
		range: isSingleValue ? [ moment(dates[0]).subtract(1,"years").format("YYYY-12-01"),
					 moment(dates[0]).add(1,"years").format("YYYY-02-01") ]
				     : // and for '2013-xx-xx to 2017-xx-xx: ['2012-12-01', '2018-02-01']
				       isDoubleValue ? [ moment(dates[0]).subtract(1,"years").format("YYYY-12-01"),
							 moment(dates[1]).add(1,"years").format("YYYY-02-01") ]
						     : []
	    },
	    yaxis: {
		title: unit
	    },
	    height: 250,
	    margin: { l:50, r:50, b:75, t:50, pad:0 }
	};

	let config = {
	    showLink: false,
	    displayModeBar: false
	};

	return (<PlotlyComponent className={this.state.chartName} data={data} layout={layout} config={config}/>);
    }
}
