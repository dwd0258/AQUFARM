var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql')
var cors = require('cors');
var express = require('express')
var session = require('express-session')
var mysqlStore = require('express-mysql-session')(session);
var passport = require('passport');
var app = express();
var indexRouter = require('./routes/index');
var crypto = require('crypto');
var flash = require('connect-flash');
const { JSDOM } = require("jsdom");
const { window } = new JSDOM("");
const $ = require("jquery")(window);

const { exec } = require('child_process');
var Stream = require('node-rtsp-stream')


var nodemailer = require('nodemailer');
var randomNumber = function (min, max) { return Math.floor(Math.random() * max - min + 1) + min; };
require("dotenv").config({ path: "lib/settings.env" })

const transporter = nodemailer.createTransport({
    service: 'gamil',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.MAIL_ID,
        pass: process.env.MAIL_PW
    }
});


// DB 설정
const options = {
  host: process.env.DB_HOST, 
  port: process.env.DB_PORT,
  user: process.env.DB_ID,
  password: process.env.DB_PW,
  database: process.env.DB_NAME
}
const db = mysql.createConnection(options);
const sessionStore = new mysqlStore(options);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: { 
    httpOnly: true,
    secure: false,
    maxAge: 30 * 60 * 1000 // 1000: 1초 -> 30분
  }
}));
app.use(passport.authenticate('session'));
app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    origin: "http://localhost:3003",
    credentials: true,
  })
);
app.use(flash());


app.use('/', indexRouter);
require('./lib/passport')(passport, options);


// SMTP 전송 및 인증
app.post('/smtp', function(req, res) {
  var base64crypto = (password) => { return crypto.createHash('sha512').update(password).digest('base64') }
  const number = randomNumber(111111, 999999);
  var passkey = base64crypto(number.toString());
  const email = req.body.email;

  const mailOptions = {
    from: process.env.MAIL_ID,
    to: email,
    subject: "인증관련 메일입니다.",
    attachments: [{
      filename: "aqufarm.png",
      path: "public/imgs/aqufarm.png",
      cid: "aqufarm"
    }],
    html: `
    <img src="cid:aqufarm" style="height: 60px; padding: 0.5rem;">
    <h3>\n\n &nbsp;인증번호는 ${number} 입니다.\n</h3>
    `
  }
  
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      res.send({ ok: false, msg: '메일 전송에 실패하였습니다.', key: null });
      console.log(err);
    } else {
      transporter.close();
      res.send({ ok: true, msg: '메일 전송에 성공하였습니다.', key: passkey });
    }
  })
})
app.post('/authMail', function(req, res) {
  var base64crypto = (password) => { return crypto.createHash('sha512').update(password).digest('base64') }
  const userNumber = base64crypto(req.body.userNumber);
  const number = req.body.number;

  if (userNumber == number) res.send({ msg: '인증에 성공하였습니다.', ok: true });
  else res.send({ msg: '인증에 실패하였습니다.', ok: false });
})


// 비밀번호 변경
app.post('/change_pw', function(req, res) {
  var base64crypto = (password) => { return crypto.createHash('sha512').update(password).digest('base64') }
  const id = req.body.id;
  const pw = base64crypto(req.body.pw);
  db.query('update members set pw=? where id=?', [pw, id], 
    function(err) {
      if (err) {
        res.send("<script>alert('비밀번호 변경에 실패했습니다.');location.href='/forgot_pw';</script>");
      } else res.send("<script>alert('비밀번호 변경에 성공했습니다.'); location.href='/login';</script>")
    }
  )
})


// 아이디 중복 검사
app.post('/duplicate', function(req, res) {
  var uid = req.body.uid;
  var val = true;

  db.query('select * from members_temp where id=?' , [uid],
    function(err, data) {
      if (err) throw(err);
      if (data[0]) val = false;
    }
  )
  if (val == false) res.send(val)
  else {
    db.query('select * from members where id=?', [uid],
      function(err, data) {
        if (err) throw(err);
        if (data[0]) val = false;
        res.send(val);
      }
    )
  }
})


// 일반 및 학생 회원가입
app.post('/register', function(req, res) {
  var base64crypto = (password) => { return crypto.createHash('sha512').update(password).digest('base64') }
  var level = req.body.level;
  var q = ['members', 'members_temp', 'members']
  let sql = ''
  let params = [];
  var name = req.body.name;
  var school = req.body.school;
  var id = req.body.id
  var pw = base64crypto(req.body.pw)
  var today = new Date();
  var date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

  if (level == 2) {
    params = [Number(level), school, name, id, pw, date]
    sql = `insert into ${q[level]} (level, school, name, id, pw, date) values (?, ?, ?, ?, ?, ?);`
  } else {
    var grade = req.body.grade;
    var classNum = req.body.class;
    var number = req.body.number
    params = [Number(level), school, name, Number(grade), Number(classNum), Number(number), id, pw, date]
    sql = `insert into ${q[level]} (level, school, name, grade, class, number, id, pw, date) values (?, ?, ?, ?, ?, ?, ?, ?, ?);`
  }

  db.query(sql, params,
    function(err, data) {
      if (err) {
        res.send("<script>alert('회원가입에 실패하였습니다. 다시 시도해 주세요.'); location.href='/register';</script>");
      } else {
        if (level != 1) res.send("<script>alert('회원가입이 완료되었습니다.');location.href='/login';</script>");
        else res.send("<script>alert('회원가입 신청이 완료되었습니다.\\n\\n회원가입 승인 후 로그인이 가능합니다.');location.href='/login';</script>");
      }
    }
  )
})


// 교사 회원가입 및 가입승인, 삭제
app.post('/members_temp', function(req, res) {
  db.query('select * from members_temp', function(err, data) {
    if(err) throw(err);
    else {
      let datas = [];

      if (data.length == 0) res.send();
      $.each(data, function(i, v) {
        datas.push({
          id: v.id,
          level: v.level,
          school: v.school,
          name: v.name,
          grade: v.grade,
          class: v.class,
          number: v.number,
          date: v.date
        })
        if (data.length - 1 == i) res.send(datas);
      })
    }
  })
})
app.post('/members_temp_suc', function(req, res) {
  var id = req.body.id;
  var today = new Date();
  var date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

  db.query('select * from members_temp where id=?;', [id],
    function(err, data) {
      if(err) throw(err);
      db.query('insert into members(level, school, name, grade, class, number, id, pw, date) values(?, ?, ?, ?, ?, ?, ?, ?, ?);', 
      [Number(data[0].level), data[0].school, data[0].name, Number(data[0].grade), Number(data[0].class), Number(data[0].number), data[0].id, data[0].pw, date],
        function(err, data) {
          if(err) throw(err);
          db.query('delete from members_temp where id=?;', [id], 
            function(err, data) { if(err) throw(err); }
          )
          res.send('회원가입 승인이 완료되었습니다.');
        }
      )
    }
  )
})
app.post('/members_temp_del', function(req, res) {
  var id = req.body.id;

  db.query(`delete from members_temp where id=?;`, [id], 
    function(err, data) {
      if(err) throw(err);
      res.send('회원 삭제가 완료되었습니다.');
    }
  )
})
app.post('/members_del', function(req, res) {
  var id = req.body.id;

  db.query(`delete from members where id=?;`, [id], 
    function(err, data) {
      if(err) throw(err);
      req.session.destroy(() => {
        delete req.session;
        res.clearCookie('connect.sid');
        res.send('회원 삭제가 완료되었습니다.');
        res.redirect('/login');
      });
    }
  )
})


// 아이디 저장 쿠키 생성
app.post('/check_idbox', function(req, res) {
  const uid = req.cookies['idCookie'];
  if (uid !== undefined) res.send(uid);
  else res.send(undefined);
})


// 로그인
app.post("/session_login", (req, res) => {
  const check = req.body.cookie;
  const id = req.body.uid;

  passport.authenticate("local",
      (err, user, msg) => {
        if (user) {
          req.login(user, (error)=>{
            if (error) res.send(error);
            else {
              if (check) res.cookie('idCookie', id, { maxAge: 7 * 24 * 60 * 60 * 1000 });
              else res.clearCookie('idCookie');
              res.redirect("/");
            }
          });
        } else res.send(`<script>alert('${msg.message}'); location.href='/login';</script>`);
  })(req, res)
});
app.get('/session', function(req, res) {
  var data = [];
  if (req.isAuthenticated()) {
    data.push({
      auth: req.isAuthenticated(),
      id: req.user.id,
      level: req.user.level,
      school: req.user.school,
      name: req.user.name,
      grade: req.user.grade,
      class: req.user.class,
      number: req.user.number,
    });
  }
  else data.push({auth: req.isAuthenticated()});
  res.send(data);
});
app.post('/session_logout', function(req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy(() => {
      delete req.session;
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  });
});


// 인덱스 페이지 디바이스 생성
app.post('/get_device', function(req, res) {
  let id = req.body.id;
  let datas = [];

  db.query('select * from link left join devices on link.device_id = devices.device_id where link.user_id=?', [id], 
    function(err, data) {
      if (err) throw(err);
      if (data.length == 0) res.send();
      
      $.each(data, function(i, v) {
        datas.push({
          name: v.name,
          user_id: v.user_id,
          device_id: v.device_id,
          time: v.time,
          link_level: v.link_level,
          join: v.date,
          service: v.service
        })

        if (data.length - 1 == i) res.send(datas);
      })
      
    }
  )
});


// 회원 정보 테이블 생성
app.post('/searchTable', function(req, res) {
  let userLevel = req.body.userLevel;
  let level = req.body.level;
  let school = req.body.school;
  let grade = req.body.grade;
  let classNum = req.body.class;
  let name = req.body.name;
  let start = req.body.start;
  let end = req.body.end;
  let sql = '';
  let data = null;

  if (userLevel == 1) {
    sql = `select * from members where id not in (?) and school like ? and level like ? and name like ? and grade=? and class=? and level < 3`
    data = [ req.user.id, '%'+school+'%', '%'+level+'%', '%'+name+'%', grade, classNum]
  } else if (userLevel == 4) {
    sql = `select * from members where id not in (?) and school like ? and level like ? and name like ? and level=2`
    data = [ req.user.id, '%'+school+'%', '%'+level+'%', '%'+name+'%']
  } 
  else {
    sql = `select * from members where id not in (?) and school like ? and level like ? and name like ? and level < 2`
    data = [ req.user.id, '%'+school+'%', '%'+level+'%', '%'+name+'%']
  }
  if (start == end) sql += ` and date='${end}'`
  else if (start != '' && start != undefined) sql += ` and date between str_to_date('${start}', '%Y-%m-%d') and str_to_date('${end}', '%Y-%m-%d')`
  db.query(sql, data,
    function(err, data) {
      if(err) throw(err);
      else {
        let val = [];
        if (data.length == 0) res.send(null);
        else {
            $.each(data, function(i, v) {
            val.push({
              id: v.id,
              level: v.level,
              school: v.school,
              name: v.name,
              grade: v.grade,
              class: v.class,
              number: v.number,
              date: v.date
            })
            if (data.length - 1 == i) res.send(val);
          })
        }
      };
    }
  )
})


// 회원정보 수정
app.post('/modify_profile', function(req, res) {
  var base64crypto = (password) => { return crypto.createHash('sha512').update(password).digest('base64') }
  let pw = base64crypto(req.body.pw);
  let id = req.user.id;
  let school = req.body.school;
  let name = req.body.name;
  let grade = req.body.grade;
  let classNum = req.body.class;
  let number = req.body.number;

  db.query('update members set school=?, name=?, grade=?, class=?, number=?, pw=? where id=?', 
    [school, name, grade, classNum, number, pw, id], function(err, data) {
      if(err) {
        res.send("회원정보수정에 실패했습니다.");
        throw(err);
      } else res.send("<script>alert('회원정보수정이 완료되었습니다.');location.href='/modify_profile';</script>");
    })
})


// 기기 검색
app.post('/device_all', function(req, res) {
  db.query('select * from devices', function(err, data) {
    if (err) throw(err);
    else {
      let datas = [];

      if (data.length == 0) res.send();
      $.each(data, function(i, v) {
        datas.push({
          id: v.device_id,
          name: v.name
        })
        if(data.length - 1 == i) res.send(datas);
      })
    }
  })
})


// 기기 연결 추가 및 제어
app.post('/get_link', function(req, res) {
  let id = req.body.id;

  db.query('select * from link where user_id=?', [id], 
    function(err, data) {
      if (err) throw(err);
      else {
        let datas = [];
        if (data.length == 0) res.send(datas);
        $.each(data, function(i, v) {
          datas.push({
            device_id: v.device_id, 
            name: v.name,
            link_level: v.link_level,
          })
          if(data.length - 1 == i) res.send(datas);
        })
      }
    })
})
app.post('/delete_link', function(req, res) {
  let items = JSON.parse(req.body.items);
  let uid = req.body.uid;

  if (items.length == 0) res.send();
  $.each(items, function(i, v) {
    let sql = `delete from link where user_id=? and device_id=?`

    db.query(sql, [uid, v.device_id], 
      function(err, data) {
        if (err) throw(err);
      }
    )
    if (items.length - 1 == i) res.send();
  })
})
app.post('/insert_link', function(req, res) {
  let items = JSON.parse(req.body.items);
  let uid = req.body.uid;
  let today = new Date();
  let date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate() + " " + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  let tmp = req.body.ulevel;
  let ulevel = 0;
  if (tmp > 0) ulevel = Number(tmp) + 1

  if (items.length == 0) res.send();
  $.each(items, function(i, v) {
    let params = [v.name, v.user_id, Number(v.device_id), date, ulevel];
    let sql = `insert into link (name, user_id, device_id, time, link_level) select ? where not exists(select * from link where user_id='${uid}' and device_id=?)`;

    db.query(sql, [params, Number(v.device_id)],
      function(err, data) {
        if (err) throw(err);
      }
    )
    if (items.length - 1 == i) res.send();
  })
})


// 기기 권한 제어
app.post('/update_link', function(req, res) {
  let items = JSON.parse(req.body.items);
  let uid = req.body.uid;
  let tmp = req.body.level;
  
  if (items.length == 0) res.send();
  $.each(items, function(i, v) {
    let level = 0;
    if (v.selected == true) tmp == 0 ? level = 1 : level = 2

    let params = [level, uid, v.device_id];
    let sql = `update link set link_level=? where user_id=? and device_id=?`

    db.query(sql, params, 
      function(err, data) {
        if (err) throw(err);
      }
    )
    if (items.length - 1 == i) res.send();
  })
})


// 환경정보 데이터
app.post('/search_envir', function(req, res) {
  const device_id = req.body.device_id;
  const start = req.body.start;
  const end = req.body.end;
  let sql = '';

  sql = 'select * from envir where device=?'
  if (start == end) sql += ` and time='${end}'`
  else if (start != '' && start != undefined) sql += ` and time between str_to_date('${start}', '%Y-%m-%d %H:%i:%s') and str_to_date('${end}', '%Y-%m-%d %H:%i:%s')`
  db.query(sql, [Number(device_id)], function(err, data) {
    if (err) throw(err);
    else {
      if (data.length == 0) res.send();
      else {
        data = data.sort(function(a, b) { return new Date(a.time) - new Date(b.time); })
        res.send(data);
      }
    }
  })
})


// 온오프 센서 제어
app.get('/get_sensor', function(req, res) {
  const device_id = req.query.device_id;

  db.query('select * from sensor where sd_id=?', [Number(device_id)],
    function(err, data) {
      if (err) throw(err);
      res.send(data);
    }
  )
})
app.get('/update_sensor', function(req, res) {
  const device_id = req.query.device_id;
  const sensor = req.query.sensor;
  const val = req.query.val;

  db.query(`update sensor set ${sensor}=? where sd_id=?`, [Number(val), Number(device_id)], 
    function(err, data) {
      if (err) throw(err);
      res.send();
    }
  )
})


// 스트리밍
app.post('/get_stream', function(req, res) {
  var stream = new Stream({
    name: 'name',
    streamUrl: 'rtsp://{aqufarm}:{aqufarm6552}@', // 주소 추가
    wsPort: 9999,
    ffmpegOptions: { // options ffmpeg flags
      '-stats': '', // an option with no neccessary value uses a blank string
      '-r': 30 // options with required values specify the value after the key
    }
  })

  res.send(stream);
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
