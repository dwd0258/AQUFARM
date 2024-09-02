var devices = [];

$(document).ready(function() {
    $.ajax({
        url: "/device_all",
        method: "post",
        async: false, 
        success: function(data) {
            $.each(data, (i, v) => {
                devices.push({
                    text: v.name, 
                    value: (v.id).toString(),
                    selected: false
                })
                if (data.length - 1 == i) {
                    multiplelist = new DualListbox("#modal-select" , {
                        sortable: true,
                        options: devices,
                        availableTitle: "권한 미부여 기기",
                        selectedTitle: "권한 부여 기기",
                        addButtonText: "추가",
                        addAllButtonText: "전체추가",
                        removeButtonText: "삭제",
                        removeAllButtonText: "전체삭제"
                    });
                }
            })
        }
    })
})

function modal_func(id, level, select) {
    $.ajax({
        url: '/get_link',
        method: 'post',
        data: { id: id },
        async: false,
        success: function(data) {
            let options = [];

            $.each(devices, (i, v) => {
                if (select == 0) {
                    if (data.filter(it => it.device_id == v.value).length != 0) devices[i].selected = true
                    else devices[i].selected = false
                } else {
                    let dataFilter = data.filter(it => it.device_id == v.value);
                    if (dataFilter.length != 0) {
                        options.push({
                            text: v.text,
                            value: v.value,
                            selected: (dataFilter[0].link_level != 0)
                        })
                    }
                }
                if (devices.length - 1 == i) {
                    if (select == 0) {
                        multiplelist.options = devices;
                        $("#modal_success_btn").attr('onclick', 'updateDevice(this)');
                    }
                    else {
                        multiplelist.options = options;
                        $("#modal_success_btn").attr('onclick', 'update_link_level(this)');
                    }
                    multiplelist.redraw();
                    $("#modal_title").html("ID: " + id + " 권한설정");
                    $("#modal_success_btn").addClass(`userid_${id}`);
                    $("#modal_success_btn").addClass(`userlevel_${level}`);
                    $('#device_modal').on('hidden.bs.modal', function (e) { 
                        $("#modal_success_btn").removeClass(`userid_${id}`); 
                        $("#modal_success_btn").removeClass(`userlevel_${level}`);
                    })
                    $("#device_modal").modal('show');
                }
            })
        }
    })
}


function updateDevice(btn) {
    let uid = $(btn).attr('class').split("userid_")[1].split(" ")[0];
    let ulevel = $(btn).attr('class').split("userlevel_")[1].split(" ")[0];
    let selected_item = [];
    let unselected_item = [];

    $.each(multiplelist.options, (i, v) => {
        if (v.selected == true) {
            selected_item.push({
                name: v.text,
                user_id: uid,
                device_id: v.value,
            })
        } else {
            unselected_item.push({
                device_id: v.value,
            })
        }
        if (multiplelist.options.length - 1 == i) {
            axios({
                url: '/delete_link',
                method: 'post',
                data: {
                    items: JSON.stringify(unselected_item),
                    uid: uid,
                },
            }).then(function(data) {
                console.log('del')
            })

            axios({
                url: '/insert_link',
                method: 'post',
                data: { 
                    items: JSON.stringify(selected_item), 
                    uid: uid,
                    ulevel: ulevel,
                }, 
            }).then(function(data) {
                console.log('ins');
            })
        }
    })
    $("#device_modal").modal('hide');
}


function update_link_level(btn) {
    let uid = $(btn).attr('class').split("userid_")[1].split(" ")[0];
    let ulevel = $(btn).attr('class').split("userlevel_")[1].split(" ")[0];
    let items = [];

    $.each(multiplelist.options, (i, v) => {
        items.push({
            device_id: v.value,
            selected: v.selected
        })
        if (multiplelist.options.length - 1 == i) {
            axios({
                url: '/update_link',
                method: 'post',
                data: {
                    items: JSON.stringify(items),
                    uid: uid,
                    level: ulevel,
                },
            }).then(function(data) {
                console.log('upd');
            })
        }
    })
    $("#device_modal").modal('hide');
}