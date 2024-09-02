function create_chart(data, time, id, group, col, num) {
    let chartdata = [];
    let y = [];
    $.each(group, (i, v) => {
        chartdata.push({
            name: v,
            data: data[i]
        })
    })
    if (col == 'temp') {
        $.each(['외부온도', '외부온도', '습도'], (i, v) => {
            y.push({
                opposite: i == 2 ? true : false,
                seriesName: v,
                show: i == 1 ? false : true, 
                axisTicks: { show: true },
                axisBorder: { show: true, color: colors[i] },
                labels: { style: { colors: colors[i] } },
                title: { text: i < 2 ? '외부온도/수온' : '습도', style: { color: colors[i] } }
            })
        })
    } else if (col == 'sensor') {
        $.each(['ON/OFF'], (i, v) => {
            y.push({
                opposite: false,
                seriesName: v,
                show: true, 
                axisTicks: { show: true },
                axisBorder: { show: true, color: colors[i] },
                labels: { style: { colors: colors[i] } },
                title: { text: v, style: { color: colors[i] } }
            })
        })
    } else if (col == 'illum') {
        $.each(['조도'], (i, v) => {
            y.push({
                opposite: false,
                seriesName: v,
                show: true, 
                axisTicks: { show: true },
                axisBorder: { show: true, color: colors[i] },
                labels: { style: { colors: colors[i] } },
                title: { text: v, style: { color: colors[i] } }
            })
        })
    } else {
        $.each(['EC', 'pH/DO', 'pH/DO'], (i, v) => {
            y.push({
                opposite: i > 0 ? true : false,
                seriesName: v,
                show: i == 2 ? false : true, 
                axisTicks: { show: true },
                axisBorder: { show: true, color: colors[i] },
                labels: { style: { colors: colors[i] } },
                title: { text: v, style: { color: colors[i] } }
            })
        })
    }


    var options = {
        chart: {
            height: '100%',
            width: '100%',
            type: "line",
            stacked: false, 
        },
        dataLabels: {
            enabled: false,
            position: 'top',
        },
        colors: colors.slice(0, num),
        series: chartdata,
        stroke: {
            curve: 'smooth',
            width: [4, 4, 4]
        },
        plotOptions: {
            bar: {
            columnWidth: "20%"
            }
        },
        xaxis: {
            categories: time,
            tickAmount: 10,
        },
        yaxis: y,
        tooltip: {
            enabled: true,
            shared: true,
            intersect: false,
            x: { show: true },
        },
        legend: {
            horizontalAlign: "left",
            offsetX: 40,
        },
        grid: {
            borderColor: '#e7e7e7',
            row: {
                colors: ['#f3f3f3', 'transparent'],
                opacity: 0.5
            },
        },
    };
    new ApexCharts(document.querySelector(id), options).render();
    window.dispatchEvent(new Event('resize'));
}