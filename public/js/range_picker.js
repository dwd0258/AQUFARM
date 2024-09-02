$( function() { 
    $("#stdate").daterangepicker({ 
        autoUpdateInput: false,
        locale: { cancelLabel: 'Clear' }
    }); 
    
    $("#stdate").on('apply.daterangepicker', function(ev, picker) {
        $(this).val(picker.startDate.format('YYYY-MM-DD') + ' ~ ' + picker.endDate.format('YYYY-MM-DD'));
    });
    $("#stdate").on('cancel.daterangepicker', function(ev, picker) { $(this).val(''); });
});