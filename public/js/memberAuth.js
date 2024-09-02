const level = ['학생용', '교사용', '일반용', '관리자', '관리자']
var id = null;
var member = null;

function logout() {
    var f = document.createElement('form');
    f.setAttribute('method', 'post');
    f.setAttribute('action', '/session_logout');
    document.body.appendChild(f);
    f.submit();
}

$(document).ready(function() {
    $.ajax({
    url: "/session",
    method: "get",
    async: false,
    success:function(data) {
        if (data[0].auth == false) {
            alert("로그인 후 이용해주세요.");
            location.replace('/login');
        }
        else {
            member = data;
            id = data[0].id;
            $("#level").text(level[data[0].level]);
            $("#username").text(data[0].name.slice(0, 1));
            if (level[data[0].level] == '학생용' || level[data[0].level] == '일반용' || data[0].level == 4) $('#stumanag').hide();
            if (level[data[0].level] !== '관리자') $('#settings').hide();

            axios({
                url: "/get_device",
                method: "post",
                data: { id: id },
            }).then(function(data) {
                let deviceHtml = '';
                $.each(data.data, (i, val) => {
                    deviceHtml += `<a href="/dashboard${val.service==1?'_premium':''}?name=${val.name}&device=${val.device_id}&service=${val.service}&level=${val.link_level}" class="nav_link"
                                    data-bs-toggle="tooltip" data-bs-placement="right" title="${val.name}">
                                    <i class='bx bx-devices nav_icon'></i> <span class="nav_name">${val.name}</span>
                                </a>`
                    if (data.data.length - 1 == i) $("#pages").append(deviceHtml);
                })
            })
        }
    }
    })
})   