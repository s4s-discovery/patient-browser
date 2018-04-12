import React       from "react"
import PropTypes   from "prop-types"
import moment      from "moment"
import { getPath } from "../../lib"
import Grid        from "./Grid"
import ValueRange  from "./ValueRange"
import Time        from "./Time"
import Period      from "./Period"
import Date        from "./Date"
import LineChart   from "../LineChart"
import CandlestickChart   from "../CandlestickChart"

export default class Observations extends React.Component
{
    static propTypes = {
	resources: PropTypes.arrayOf(PropTypes.object),
	type: PropTypes.string
    };

    constructor(props) {
        super(props);
    }

    getObservationLabel(o) {
        return (
            getPath(o, "code.coding.0.display") ||
            getPath(o, "code.text") ||
            getPath(o, "valueQuantity.code")
        );
    }

    renderObservation(o, includeLabel = false) {
        if (Array.isArray(o.component)) {
            return o.component.map((c, i) => {
                let result = this.renderObservation(c, true);
                return (
                    <span key={i}>
                        { i > 0 && <span>,&nbsp;</span> }
                        {result}
                    </span>
                );
            });
        }

        const returnResult = result => {
            return (
                <span>
                    {includeLabel && <label className="text-muted">{
                        this.getObservationLabel(o)
                        .replace(/^\s*(Systolic|Diastolic)\s+blood\s+pressure\s*$/gi, "$1")
                    }:&nbsp;</label>}
                    {result}
                </span>
            );
        };

        // valueBoolean
        if (o.hasOwnProperty("valueBoolean")) {
            return returnResult(
                !o.valueBoolean || o.valueBoolean == "false" ?
                "Negative" :
                "Positive"
            );
        }

        // valueString
        if (o.hasOwnProperty("valueString")) {
            return returnResult(String(o.valueString));
        }

        // valueRange
        if (o.hasOwnProperty("valueRange")) {
            return returnResult(<ValueRange range={o.valueRange}/>)
        }

        // valueTime
        if (o.hasOwnProperty("valueTime")) {
            return returnResult(<Time moment={o.valueTime}/>)
        }

        // valueDateTime
        if (o.hasOwnProperty("valueDateTime")) {
            return returnResult(<Date moment={o.valueDateTime}/>)
        }

        // valuePeriod
        if (o.hasOwnProperty("valuePeriod")) {
            return returnResult(Period(o.valuePeriod));
        }

        // valueCodeableConcept
        if (o.hasOwnProperty("valueCodeableConcept")) {
            return returnResult(getPath(o, "valueCodeableConcept.coding.0.display"));
        }

        // valueQuantity
        if (o.hasOwnProperty("valueQuantity")) {
            let value = getPath(o, "valueQuantity.value");
            let units = getPath(o, "valueQuantity.unit");

            if (!isNaN(parseFloat(value))) {
                value = Math.round(value * 100) / 100;
            }

            return returnResult(
                <span>{value} <span className="text-muted">{units}</span></span>
            );
        }

        /* TODO:
        valueRatio      : Ratio
        valueSampledData: SampledData
        valueAttachment : Attachment
        */

        return returnResult(<span className="text-muted">N/A</span>)
    }

    groupBy(arr, propOrAccFn)
    {
	return arr.reduce((result, elt) => {
	    let prop = propOrAccFn instanceof Function ? propOrAccFn(elt) : propOrAccFn;
	    if (!result[prop]) { result[prop] = []; }
	    result[prop].push(elt);
	    return result;
	}, {});
    }

    renderGraphs()
    {
	let items = (this.props.resources || []).map(item => {
	    return item.resource;
	})

	// If no component values then no displayable data
	if (!items || items[0].component == undefined) {
	    return "";
	}

	// Collect/group items to display in each graph
	let groups = this.groupBy(items, item => item.component[0].code.text);

	// Initialize the return array
	let results = [];

	// Build each graph
	for (var key in groups) {
	    let selectedItems = groups[key];
	    // Only graph if more than one value and "graphable" (numeric)
	    if(selectedItems.length > 1 && selectedItems[0].component[0].isGraphable) {
		let isDoubleValue = selectedItems[0].component[1] != undefined;	// First item has two components?
		if (isDoubleValue) {
		    results.push(<CandlestickChart key={key} resources={selectedItems} targetObservation={key}/>);
		} else {
		    results.push(<LineChart key={key} resources={selectedItems} targetObservation={key}/>);
		}
	    }
	}

	if (results.length > 0) {
	    return (
		<div id="graphs">
		    { results }
		</div>
	    )
	}	    
	else
	    return "";
    }

    render()
    {
        return (
	    <div>
		{ this.props.type ? this.renderGraphs() : "" }
		<Grid
            	    rows={ (this.props.resources || []).map(o => o.resource) }
            	    title="Observations"
                    groupBy="Name"
                    comparator={(a,b) => {
                        let dA = getPath(a, "effectiveDateTime") || getPath(a, "meta.lastUpdated");
                        let dB = getPath(b, "effectiveDateTime") || getPath(b, "meta.lastUpdated");
                        dA = dA ? +moment(dA) : 0;
                        dB = dB ? +moment(dB) : 0;
                        return dB - dA;
                    }}
                    cols={[
                        {
                            label : "Name",
                            path  : o => this.getObservationLabel(o),
                            render: o => <b>{this.getObservationLabel(o)}</b>
                        },
                        {
                            label : "Value",
                            render: o => this.renderObservation(o)
                        },
                        {
                            label: "Date",
                            render: o => {
                                let date = getPath(o, "effectiveDateTime") || getPath(o, "meta.lastUpdated");
                                if (date) date = moment(date).format("MM/DD/YYYY");
                                return <div className="text-muted">{ date || "-" }</div>
                            }
                        }
                    ]}
                />
	    </div>
        )
    }
}
