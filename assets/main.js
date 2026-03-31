let dvd = document.getElementById('dvd');
let dvd2 = document.getElementById('dvd2');
let dvd3 = document.getElementById('dvd3');


let x_inc = 3;
let y_inc = 3;

let x2_inc = 4;
let y2_inc = 4;

let x3_inc = 6;
let y3_inc = 6;

let dvd_pos = { x: 0, y: 0 };
let dvd2_pos = { x: 0, y: 0 };
let dvd3_pos = { x: 0, y: 0 };
let last_frame_time = 0;

let dvd_size = { width: 0, height: 0 };
let dvd2_size = { width: 0, height: 0 };
let dvd3_size = { width: 0, height: 0 };

let colour = 0;
let click_counter = 0;

let dvd2_click = 10;
let dvd3_click = 20;

let audio_toggle_icon_ids = {
    femtanylplayer: 'femtanyl-toggle-icon',
    trainplayer: 'train-toggle-icon'
};

function set_audio_toggle_icon(playerId) {
    let player = document.getElementById(playerId);
    let iconId = audio_toggle_icon_ids[playerId];
    let icon = document.getElementById(iconId);

    if (!player || !icon) {
        return;
    }

    icon.src = player.paused ? './assets/player/play.png' : './assets/player/pause.png';
}

function toggle_audio(playerId) {
    let player = document.getElementById(playerId);

    if (!player) {
        return;
    }

    if (player.paused) {
        player.play();
    }
    else {
        player.pause();
    }
}

function init_audio_toggle(playerId) {
    let player = document.getElementById(playerId);

    if (!player) {
        return;
    }

    player.addEventListener('play', () => set_audio_toggle_icon(playerId));
    player.addEventListener('pause', () => set_audio_toggle_icon(playerId));
    player.addEventListener('ended', () => set_audio_toggle_icon(playerId));

    set_audio_toggle_icon(playerId);
}

function init_player_progress(playerId, progressId) {
    let player = document.getElementById(playerId);
    let progress = document.getElementById(progressId);

    if (!player || !progress) {
        return;
    }

    function update_progress() {
        let duration = Number.isFinite(player.duration) ? player.duration : 0;
        let currentTime = Number.isFinite(player.currentTime) ? player.currentTime : 0;

        progress.max = duration > 0 ? duration : 100;
        progress.value = duration > 0 ? currentTime : 0;
    }

    player.addEventListener('loadedmetadata', update_progress);
    player.addEventListener('timeupdate', update_progress);
    player.addEventListener('durationchange', update_progress);
    player.addEventListener('ended', update_progress);

    progress.addEventListener('input', function () {
        if (Number.isFinite(player.duration) && player.duration > 0) {
            player.currentTime = Number(progress.value);
            update_progress();
        }
    });

    update_progress();
}

async function init_server_temp() {
    let serverTemp = document.getElementById('server-temp');

    if (!serverTemp) {
        return;
    }

    serverTemp.textContent = '...';

    try {
        let response = await fetch('https://api.ouppy.space/server');
        if (!response.ok) {
            throw new Error('Failed to fetch server temp');
        }

        let data = await response.json();
        let temp = Number(data.temp);

        if (Number.isFinite(temp)) {
            serverTemp.textContent = temp.toFixed(1);
            return;
        }

        serverTemp.textContent = '--';
    }
    catch {
        serverTemp.textContent = '--';
    }
}

function init() {

    dvd.style.position = 'absolute';
    dvd.style.zIndex = 10;
    dvd.style.top = '0px';
    dvd.style.left = '0px';
    dvd.style.willChange = 'transform, filter';

    dvd2.style.position = 'absolute';
    dvd2.style.zIndex = 10;
    dvd2.style.top = '0px';
    dvd2.style.left = '0px';
    dvd2.style.willChange = 'transform';

    dvd3.style.position = 'absolute';
    dvd3.style.zIndex = 10;
    dvd3.style.left = '0px';
    dvd3.style.top = '0px';
    dvd3.style.willChange = 'transform';

    refresh_sprite_sizes();

    dvd_pos.x = 0;
    dvd_pos.y = 0;

    dvd2_pos.x = Math.max(window.innerWidth - dvd2_size.width, 0);
    dvd2_pos.y = 0;

    dvd3_pos.x = 0;
    dvd3_pos.y = Math.max(window.innerHeight - dvd3_size.height, 0);

    apply_position(dvd, dvd_pos);
    apply_position(dvd2, dvd2_pos);
    apply_position(dvd3, dvd3_pos);

    requestAnimationFrame(frame);

}

function update_colour(step){
    if (colour >= 360){
        colour = 0;
    }
    dvd.style.filter = `hue-rotate(${colour}deg)`;
    document.body.style.color = `hsl(${colour}, 100%, 50%)`;
    colour = colour + (2 * step);
}

function apply_position(element, position) {
    element.style.transform = `translate(${position.x}px, ${position.y}px)`;
}

function refresh_sprite_sizes() {
    let dvd_rect = dvd.getBoundingClientRect();
    let dvd2_rect = dvd2.getBoundingClientRect();
    let dvd3_rect = dvd3.getBoundingClientRect();

    dvd_size.width = dvd_rect.width;
    dvd_size.height = dvd_rect.height;

    dvd2_size.width = dvd2_rect.width;
    dvd2_size.height = dvd2_rect.height;

    dvd3_size.width = dvd3_rect.width;
    dvd3_size.height = dvd3_rect.height;
}

function move_sprite(element, position, size, velocityX, velocityY, step) {
    let width = size.width;
    let height = size.height;
    let maxX = Math.max(window.innerWidth - width, 0);
    let maxY = Math.max(window.innerHeight - height, 0);

    position.x = position.x + (velocityX * step);
    position.y = position.y + (velocityY * step);

    if (width > 0) {
        if (position.x <= 0 && velocityX < 0) {
            position.x = 0;
            velocityX = ~velocityX + 1;
        }
        else if (position.x >= maxX && velocityX > 0) {
            position.x = maxX;
            velocityX = ~velocityX + 1;
        }
    }

    if (height > 0) {
        if (position.y <= 0 && velocityY < 0) {
            position.y = 0;
            velocityY = ~velocityY + 1;
        }
        else if (position.y >= maxY && velocityY > 0) {
            position.y = maxY;
            velocityY = ~velocityY + 1;
        }
    }

    apply_position(element, position);

    return { velocityX, velocityY };
}

function frame(timestamp) {
    if (!last_frame_time) {
        last_frame_time = timestamp;
    }

    let delta = timestamp - last_frame_time;
    last_frame_time = timestamp;
    let step = Math.min(delta / 5, 6);

    update_colour(step);

    let dvd_velocity = move_sprite(dvd, dvd_pos, dvd_size, x_inc, y_inc, step);
    x_inc = dvd_velocity.velocityX;
    y_inc = dvd_velocity.velocityY;

    if(click_counter >= dvd2_click){
        let dvd2_velocity = move_sprite(dvd2, dvd2_pos, dvd2_size, x2_inc, y2_inc, step);
        x2_inc = dvd2_velocity.velocityX;
        y2_inc = dvd2_velocity.velocityY;
    }
    if(click_counter >= dvd3_click){
        let dvd3_velocity = move_sprite(dvd3, dvd3_pos, dvd3_size, x3_inc, y3_inc, step);
        x3_inc = dvd3_velocity.velocityX;
        y3_inc = dvd3_velocity.velocityY;
    }

    requestAnimationFrame(frame);
}

function pick_image(){
    let audioElement = new Audio("./assets/err_sound.mp3");
    audioElement.volume = 0.5;
    audioElement.play();
    audioElement.remove();

    click_counter++;
    if(click_counter == dvd2_click){
        dvd2.style.display = "block";
        refresh_sprite_sizes();
    }
    if(click_counter == dvd3_click){
        dvd3.style.display = "block";
        refresh_sprite_sizes();
    }

    let img_num = Math.floor(Math.random() * 4) + 1;
 
    let err_container = document.getElementById("err-container");
    let img = document.createElement("img");
    img.src = `./assets/err${img_num}.png`;
    img.style.zIndex = 1;
    img.style.left = Math.floor(Math.random() * (window.innerWidth - 200)) + "px";
    img.style.top = Math.floor(Math.random() * (window.innerHeight - 150)) + "px";
    err_container.insertBefore(img, null);

    let opacity = 1.0;

    function set_opacity() {
        if (opacity <= 0) { 
            img.remove();
            return; 
        }

        img.style.opacity = opacity;
        opacity = opacity - 0.01;
        setTimeout(set_opacity, 50);
    }

    setTimeout(set_opacity, 50);
}

dvd.addEventListener('click', pick_image);
dvd2.addEventListener('click', pick_image);
dvd3.addEventListener('click', pick_image);
window.addEventListener('resize', refresh_sprite_sizes);

init();
document.addEventListener('DOMContentLoaded', () => {
    init_server_temp();
    setInterval(init_server_temp, 30000);
    init_audio_toggle('femtanylplayer');
    init_audio_toggle('trainplayer');
    init_player_progress('femtanylplayer', 'femtanyl-progress');
    init_player_progress('trainplayer', 'train-progress');
} );