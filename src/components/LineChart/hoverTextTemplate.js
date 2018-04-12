export default (params) => {
    return `<span style=""><span style="text-decoration:underline;font-weight:600">${params.title}</span><br>${params.value} ${params.unit}<br>(${params.date})</span>`;
}
