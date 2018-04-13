//获取元素
var mapCanvas = document.getElementById("map");
//获取2D渲染对象上下文
var content = mapCanvas.getContext("2d");
var loadingDiv = document.getElementById("loading");
var scoreSpan = document.querySelector("#currentScore>span");
var menuUl = document.getElementById("menu");
var endScoreLi = document.getElementById("end_score");
var restartLi = document.getElementById("restart");

//设置canvas画布大小为浏览器窗口大小
mapCanvas.width = document.documentElement.clientWidth;
mapCanvas.height = document.documentElement.clientHeight;

/*
 * 预加载: 浏览器只会对相同的图片加载一次
 */
//声明一个数组存储图片名称
var imageNames = ["background.png", "bullet1.png", "bullet2.png", "enemy1.png", "enemy2.png", "enemy3.png", "herofly.png", "prop.png"];
//声明一个计数器
var count = 0;
//声明一个数组存储图片对象
var images = [];
for(var i = 0; i < imageNames.length; i++) {
    var img = new Image();
    img.src = imageNames[i];
    images.push(img);
    img.onload = function() {
        count++;
        if(count == imageNames.length) {
            console.log("图片加载完毕");
            //预加载音频资源
            loadMusic();
        }
    }
}

//声明一个数组存储音频的名字
var musicNames = ["bullet.mp3", "enemy1_down.mp3", "enemy2_down.mp3", "enemy3_down.mp3", "game_music.mp3", "game_over.mp3"];
//声明一个计时器
var musicCount = 0;
//声明一个数组存储已经加载完毕的音频
var musics = [];
//加载音频的函数
function loadMusic() {
    for(var i = 0; i < musicNames.length; i++) {
        var music = new Audio();
        music.src =  musicNames[i];
        musics.push(music);
        music.onloadedmetadata = function() {
            musicCount++;
            if(musicCount == musicNames.length) {
                console.log("音频加载完毕");
                //隐藏loading
                loadingDiv.style.display = "none";
                //播放音乐
                musics[4].loop = true;
                musics[4].volume = 0.5 //音量范围0-1
                musics[4].play();
                //开始游戏
                main();
            }
        }
    }

}

//背景对象 只需要一个即可
var background = {
    //属性
    x: 0,
    y: 0,
    width: mapCanvas.width,
    height: mapCanvas.height,
    //方法
    //绘制方法
    draw: function() {
        //如何满屏显示又不调整图片的大小
        var row = Math.ceil(mapCanvas.height / 568);
        var col = Math.ceil(mapCanvas.width / 320);
//      console.log(row, col);
        //绘制
        //为了保证图片的无限滚动, 绘制两屏一模一样的背景图
        for(var i = -row; i < row; i++) {
            for(var j = 0; j < col; j++) {
                content.drawImage(images[0], j * 320, i * 568 + this.y);
            }
        }
    },
    //移动方法
    move: function() {
        this.y++;
        var row = Math.ceil(mapCanvas.height / 568);
        if(this.y >= 568 * row) {
            this.y = 0;
        }
    }
}
//英雄对象
var hero = {
    //属性
    //位置
    x: mapCanvas.width / 2 - 33,
    y: mapCanvas.height - 82 - 100,
    //宽高
    w: 66,
    h: 82,
    i: 0, //第几张图片, 从0开始
    bullets: [], //存储已经发射出去子弹
    bulletType: 0, //存储子弹类型(0:单排, 1:双排)
    boom: false, //是否爆炸 
    flagI: 0, //图片的切换频率
    flagShot: 0, //发射子弹频率
    //方法
    //绘制
    draw: function() {
        //控制图片的切换频率
        this.flagI++;
        if(this.flagI == 5) {
            //判断是否爆炸
            if(this.boom) {
                //爆炸
                this.i++;
                if(this.i == 4) {
                    //游戏结束
                    gameOver();
                }
            } else {
                //游戏继续
                //this.i = (this.i == 1) ? 0 : 1;
                this.i = (++this.i) % 2;
            }
            //重置切换频率
            this.flagI = 0;
        }
        //将英雄图片的某一部分绘制到画布上.
        content.drawImage(images[6], this.i * this.w, 0, this.w, this.h, this.x, this.y, this.w, this.h);
    },
    //发射子弹方法
    shot: function() {
        //爆炸后不再发射子弹
        if(!this.boom) {
            this.flagShot++;
        }
        if(this.flagShot == 5) {
            //播放发射子弹音频
            musics[0].play();
            //创建子弹对象
            if(this.bulletType) {
                //双排子弹
                var bullet = new Bullet(this.x + this.w / 2 - 24, this.y - 14, 48, 14, images[2], 2);
            } else {
                //单排子弹
                var bullet = new Bullet(this.x + this.w / 2 - 3, this.y - 14, 6, 14, images[1], 1);
            }
            //保存发射的子弹
            this.bullets.push(bullet);
            //重置
            this.flagShot = 0;
        }
        //移动子弹对象
        for(var i = 0; i < this.bullets.length; i++) {
            //判断子弹是否超出屏幕
            if(this.bullets[i].y <= -this.bullets[i].h) {
                //超出屏幕,移除子弹
                this.bullets.splice(i, 1);
                i--;
            } else {
                //不超出屏幕,移动子弹
                this.bullets[i].draw();
                this.bullets[i].move();
            }
        }

    }
}
//鼠标控制英雄
mapCanvas.onmousedown = function(e) {
    //1. 获取事件对象
    var even = e || event;
    //2. 获取鼠标位置
    var x = even.offsetX;
    var y = even.offsetY;
    //3. 判断鼠标点是否在英雄的区域内
    if(x >= hero.x && x <= (hero.x + hero.w) && y >= hero.y && y <= (hero.y + hero.h)) {
        //只有在英雄区域内,移动才有效果
        mapCanvas.onmousemove = function(e) {
            even = e || event;
            //更新英雄的位置
            hero.x = even.offsetX - hero.w / 2;
            hero.y = even.offsetY - hero.h / 2;
        }
    }
}

//手指控制
mapCanvas.ontouchstart = function(e) {
    var even = e || event;
    even.preventDefault();
    var x = even.touches[0].clientX;
    var y = even.touches[0].clientY;
    //3. 判断鼠标点是否在英雄的区域内
    if(x >= hero.x && x <= (hero.x + hero.w) && y >= hero.y && y <= (hero.y + hero.h)) {
        mapCanvas.ontouchmove = function(e) {
            even = e || event;
            even.preventDefault();
            //重置位置
            hero.x = even.touches[0].clientX - hero.w / 2;
            hero.y = even.touches[0].clientY - hero.h / 2;
        }
    }
}
//手指抬起
mapCanvas.ontouchend = function() {
    this.ontouchmove = null;
}

//键盘事件
window.onkeydown = function(e) {
    var even = e || event;
    switch(even.keyCode) {
        case 37:
            {
                hero.x -= 5;
                break;
            }
        case 38:
            {
                hero.y -= 5;
                break;
            }
        case 39:
            {
                hero.x += 5;
                break;
            }
        case 40:
            {
                hero.y += 5;
                break;
            }
        default:
            break;
    }
}

//鼠标抬起
mapCanvas.onmouseup = function() {
    this.onmousemove = null;
}

/*
 * 子弹类
 */
//子弹的构造函数
function Bullet(x, y, w, h, img, hurt) {
    //属性
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.img = img;
    this.hurt = hurt;
}
//绘制方法
Bullet.prototype.draw = function() {

    content.drawImage(this.img, this.x, this.y, this.w, this.h);
}
//移动方法
Bullet.prototype.move = function() {
    this.y -= 5;
}

/*
 * 敌机类
 */
//敌机构造函数
function Enemy(x, y, w, h, img, hp, speed, score, maxI) {
    //属性
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.img = img;
    this.hp = hp; //血量
    this.speed = speed; //速度
    this.score = score; //分值
    this.maxI = maxI; //控制播放图片的张数
    this.i = 0; //第几张图片
    this.flagI = 0; //控制图片的切换频率
    this.boom = false; //是否爆炸
    this.isDie = false; //敌机是否死亡
}
//绘制方法
Enemy.prototype.draw = function() {
    //爆炸之后切换图片
    if(this.boom) {
        this.flagI++;
        if(this.flagI == 5) {
            this.i++;
            if(this.i == this.maxI) {
                //图片切换到最后一格, 敌机死亡
                this.isDie = true;
            }
            this.flagI = 0;
        }
    }
    content.drawImage(this.img, this.i * this.w, 0, this.w, this.h, this.x, this.y, this.w, this.h);
}
//移动方法
Enemy.prototype.move = function() {
    this.y += this.speed;
}

//定义一个数组存储屏幕区域所有的敌机对象
var enemies = [];
//随机产生敌机的函数
function randomEnemy() {
    //控制敌机产生的速度
    var num = randomNumber(0, 1000);
    if(num < 50) {
        //创建敌机
        if(num <= 40) {
            //随机位置
            var randomX = randomNumber(0, mapCanvas.width - 38);
            //随机速度
            var randomSpeed = randomNumber(3, 8);
            //创建小飞机
            //x, y, w, h, img, hp, speed, score, maxI
            var e = new Enemy(randomX, -34, 38, 34, images[3], 1, randomSpeed, 100, 4);
        } else if(num < 48) {
            //中型飞机
            //随机位置
            var randomX = randomNumber(0, mapCanvas.width - 46);
            //随机速度
            var randomSpeed = randomNumber(3, 6);
            //创建小飞机
            //x, y, w, h, img, hp, speed, score, maxI
            var e = new Enemy(randomX, -64, 46, 64, images[4], 3, randomSpeed, 200, 5);
        } else {
            //大型飞机
            //随机位置
            var randomX = randomNumber(0, mapCanvas.width - 110);
            //随机速度
            var randomSpeed = randomNumber(3, 4);
            //创建小飞机
            //x, y, w, h, img, hp, speed, score, maxI
            var e = new Enemy(randomX, -164, 110, 164, images[5], 5, randomSpeed, 300, 9);
        }
        //把创建的敌机放进数组
        enemies.push(e);
    }
    //移动敌机
    for(var i = 0; i < enemies.length; i++) {
        //判断敌机是否死亡或者飞出屏幕
        if(enemies[i].y >= mapCanvas.height || enemies[i].isDie) {
            //移除敌机
            enemies.splice(i, 1);
            i--;
        } else {
            //移动
            enemies[i].draw();
            enemies[i].move();
        }
    }
}

/*
 * 道具类
 */
//道具构造函数
function Prop(x, y, w, h, type, speed) {
    //属性
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type; //道具类型 (0:炸弹, 1:双排子弹)
    this.speed = speed;
    this.isUsed = false; //是否被使用(false:没有使用, true:使用);
}
//方法
//绘制方法
Prop.prototype.draw = function() {
    //x, y, w, h, type, speed
    content.drawImage(images[7], this.type * this.w, 0, this.w, this.h, this.x, this.y, this.w, this.h);
}
//移动方法
Prop.prototype.move = function() {
    this.y += this.speed;
}
//声明一个数组存储屏幕内所有道具对象
var props = [];
//随机产生道具的方法
function randomProps() {
    //控制道具产生的频率
    var num = randomNumber(0, 1000);
    if(num < 10) {
        var randomX = randomNumber(0, mapCanvas.width - 38);
        var randomType = randomNumber(0, 1);
        var randomSpeed = randomNumber(3, 8);
        //x, y, w, h, type, speed
        var p = new Prop(randomX, -68, 38, 68, randomType, randomSpeed);
        //放进数组
        props.push(p);
    }
    //移动和绘制
    for(var i = 0; i < props.length; i++) {
        //判断道具是否已经出屏幕或者已经被使用
        if(props[i].y >= mapCanvas.height || props[i].isUsed) {
            //如果已经出屏幕或者已经被使用,删除道具
            props.splice(i, 1);
            i--;
        } else {
            //如果没有出屏幕或者没有被使用, 移动和绘制
            props[i].draw();
            props[i].move();
        }
    }
}

/*
 * 碰撞
 * 游戏中有三种碰撞形式
 * 1.子弹与敌机
 * 2.英雄与敌机
 * 3.道具与英雄
 */
//检测两个对象是否碰撞
function crash(obj1, obj2) {
    //分别获取两个对象的上下左右的位置信息
    var left1 = obj1.x;
    var right1 = obj1.x + obj1.w;
    var top1 = obj1.y;
    var bottom1 = obj1.y + obj1.h;

    var left2 = obj2.x;
    var right2 = obj2.x + obj2.w;
    var top2 = obj2.y;
    var bottom2 = obj2.y + obj2.h;

    if(right1 < left2 || left1 > right2 || bottom1 < top2 || top1 > bottom2) {
        return false;
    } else {
        return true;
    }
}

//验证对应的对象是否发生碰撞
function monitorObj() {
    //  1.子弹与敌机
    bulletAndEnemy();
    //  2.英雄与敌机
    heroAndEnemy();
    //  3.道具与英雄
    propAndHero();
}
//子弹与敌机
function bulletAndEnemy() {
    //遍历敌机
    for(var i = 0; i < enemies.length; i++) {
        //遍历子弹
        for(var j = 0; j < hero.bullets.length; j++) {
            //判断敌机是否已经爆炸
            if(enemies[i].boom) {
                break;
            }
            if(!crash(enemies[i], hero.bullets[j])) {
                //没有碰撞
                continue;
            }

            /*
             * 发生碰撞
             * 1.掉血
             * 2.敌机是否要爆炸
             * 3.如果爆炸,得分,播放对应的声音
             * 4.子弹消失
             */
            //掉血
            enemies[i].hp -= hero.bullets[j].hurt;
            //敌机是否要爆炸
            if(enemies[i].hp <= 0) {
                enemies[i].boom = true;
                //得分
                scoreSpan.innerHTML = parseInt(scoreSpan.innerText) + enemies[i].score;
                //播放对应的声音
                switch(enemies[i].score) {
                    case 100:
                        {
                            musics[1].play();
                            break;
                        }
                    case 200:
                        {
                            musics[2].play();
                            break;
                        }
                    case 300:
                        {
                            musics[3].play();
                            break;
                        }
                }
                //子弹消失
                hero.bullets.splice(j, 1);
                j--;
            }

        }
    }
}
//英雄与敌机
function heroAndEnemy() {
     //遍历敌机
     for (var i = 0; i < enemies.length; i++) {
     	//如果敌机已经爆炸,不需要判断是否碰撞
     	if(enemies[i].boom){
     	    continue;
     	}
     	//碰撞检测
     	if (crash(hero, enemies[i])) {
     		hero.boom = true;
     	}
     }
}
//声明一个变量存储延时器
var timeOut;
//道具与英雄
function propAndHero() {
   //遍历道具
   for (var i = 0; i < props.length; i++) {
   	    //英雄是否爆炸
   	    if (hero.boom) {
   	    	   //如果爆炸,跳出循环
   	    	   break;
   	    }
   	    //英雄是否与道具发生碰撞
   	    if (!crash(hero, props[i])) {
   	        //如果没有碰撞,跳过,判断下一个
            continue;   	    	
   	    }
   	    /*
   	     * 处理碰撞
   	     * 1.判断道具类型
   	     *   a.如果是炸弹,所有敌机爆炸,加分
   	     *   b.如果是双排子弹,暂时切换子弹类型为双排
   	     * 2.道具消失
   	     */
   	    if (props[i].type) {
   	    	    //双排
   	    	    hero.bulletType = 1;
   	    	    clearTimeout(timeOut);
   	    	    timeOut = setTimeout(function(){
   	    	        hero.bulletType = 0;
   	    	    }, 5000);
   	    }else {
   	        //炸弹
   	        //所有敌机爆炸
   	        for (var j = 0; j < enemies.length; j++) {
   	        	     enemies[j].boom = true;
   	        	     //加分
   	        	     scoreSpan.innerHTML = parseInt(scoreSpan.innerText) + enemies[j].score;
   	        }
   	    }
   	    //道具消失
   	    props[i].isUsed = true;
   }
      
}

//游戏结束函数
function gameOver() {
    //播放游戏结束声音
    musics[5].play();
    //停止其他声音
    musics[4].pause();
    //显示结束菜单
    menuUl.style.display = "block";
    //修改菜单里的分数
    endScoreLi.innerHTML = scoreSpan.innerHTML;
}

//再来一局li绑定点击事件
restartLi.onclick = function() {
    //刷新界面
    location.reload();   
}
//开始游戏函数
function main() {
    content.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    background.draw();
    background.move();
    hero.draw();
    hero.shot();
    randomEnemy();
    randomProps();
    if (!hero.boom) {
    	   monitorObj();
    }
    window.requestAnimationFrame(main);
}

//随机数函数
function randomNumber(x, y) {
    return Math.floor(Math.random() * (y - x + 1) + x);
}

//单线程 多线程      单进程 多进程
