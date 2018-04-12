export default (params) => {
    return `<span style=""><span style="text-decoration:underline;font-weight:600">${params.title}</span><br>Systolic: ${params.value1} ${params.unit}<br>Diastolic: ${params.value2} ${params.unit}<br>(${params.date})</span>`;
}
