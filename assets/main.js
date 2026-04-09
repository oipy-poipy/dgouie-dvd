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
let frame_accumulator = 0;

const TARGET_FPS = 60;
const FRAME_TIME_MS = 1000 / TARGET_FPS;
const MAX_CATCH_UP_STEPS = 5;
const FIXED_STEP = FRAME_TIME_MS / 5;

let dvd_size = { width: 0, height: 0 };
let dvd2_size = { width: 0, height: 0 };
let dvd3_size = { width: 0, height: 0 };

let colour = 0;
let click_counter = 0;

let dvd2_click = 10;
let dvd3_click = 20;
let sync_hue_images = [];
let jitter_letters = [];
let jitter_active_letters = [];

let top_text_jitter_tick = true;

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

function sync_femtanyl_shake() {
    let femtanylPlayer = document.getElementById('femtanylplayer');

    if (!femtanylPlayer) {
        return;
    }

    if (femtanylPlayer.paused) {
        document.body.classList.remove('femtanyl-shaking');
    }
    else {
        document.body.classList.add('femtanyl-shaking');
    }
}

function init_femtanyl_shake() {
    let femtanylPlayer = document.getElementById('femtanylplayer');

    if (!femtanylPlayer) {
        return;
    }

    femtanylPlayer.addEventListener('play', sync_femtanyl_shake);
    femtanylPlayer.addEventListener('pause', sync_femtanyl_shake);
    femtanylPlayer.addEventListener('ended', sync_femtanyl_shake);

    sync_femtanyl_shake();
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

function refresh_sync_hue_images() {
    sync_hue_images = Array.from(document.querySelectorAll('.sync-hue-image'));
}

function random_int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function init_text_jitter() {
    let textContainer = document.getElementById('text');
    let topTextGroup = document.getElementById('top-text-group');
    let musicGroup = document.getElementById('music-group');

    if (!textContainer || !topTextGroup || !musicGroup) {
        return;
    }

    let walker = document.createTreeWalker(textContainer, NodeFilter.SHOW_TEXT);
    let textNodes = [];
    let currentNode = walker.nextNode();

    while (currentNode) {
        textNodes.push(currentNode);
        currentNode = walker.nextNode();
    }

    for (let textNode of textNodes) {
        if (!textNode.parentElement || textNode.parentElement.closest('.player-button')) {
            continue;
        }

        if (!textNode.textContent || !textNode.textContent.trim()) {
            continue;
        }

        let fragment = document.createDocumentFragment();
        for (let character of textNode.textContent) {
            if (character.trim() === '') {
                fragment.appendChild(document.createTextNode(character));
            }
            else {
                let letter = document.createElement('span');
                letter.className = 'jitter-letter';
                letter.textContent = character;
                fragment.appendChild(letter);
            }
        }

        textNode.parentNode.replaceChild(fragment, textNode);
    }

    jitter_letters = Array.from(textContainer.querySelectorAll('.jitter-letter'));

    setInterval(() => {
        if (jitter_letters.length === 0) {
            return;
        }

        for (let letter of jitter_active_letters) {
            letter.style.fontSize = '100%';
        }

        jitter_active_letters = [];

        let changes = random_int(1, 2);
        for (let i = 0; i < changes; i++) {
            let randomLetter = jitter_letters[random_int(0, jitter_letters.length - 1)];
            randomLetter.style.fontSize = `${random_int(92, 112)}%`;
            jitter_active_letters.push(randomLetter);
        }
    }, 380);

    setInterval(() => {
        if (top_text_jitter_tick) {
            topTextGroup.style.transform = `translate(${random_int(-5, 5)}px, ${random_int(-4, 4)}px)`;
            topTextGroup.style.padding = `${random_int(0, 5)}px ${random_int(0, 8)}px`;

            musicGroup.style.transform = 'translate(0px, 0px)';
            musicGroup.style.padding = '0px';
        }
        else {
            musicGroup.style.transform = `translate(${random_int(-6, 6)}px, ${random_int(-5, 5)}px)`;
            musicGroup.style.padding = `${random_int(0, 6)}px ${random_int(0, 10)}px`;

            topTextGroup.style.transform = 'translate(0px, 0px)';
            topTextGroup.style.padding = '0px';
        }

        top_text_jitter_tick = !top_text_jitter_tick;
    }, 850);
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
    let hue = colour;
    let syncedVisualFilter = `hue-rotate(${hue}deg)`;
    let syncedWhiteTintFilter = `brightness(0) saturate(100%) invert(1) sepia(1) saturate(5000%) hue-rotate(${hue}deg)`;

    dvd.style.filter = syncedVisualFilter;
    document.body.style.color = `hsl(${hue}, 100%, 50%)`;

    for (let image of sync_hue_images) {
        image.style.filter = syncedWhiteTintFilter;
    }

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
        requestAnimationFrame(frame);
        return;
    }

    let delta = timestamp - last_frame_time;
    last_frame_time = timestamp;
    frame_accumulator = frame_accumulator + Math.min(delta, FRAME_TIME_MS * MAX_CATCH_UP_STEPS);

    let updates = 0;
    while (frame_accumulator >= FRAME_TIME_MS && updates < MAX_CATCH_UP_STEPS) {
        update_colour(FIXED_STEP);

        let dvd_velocity = move_sprite(dvd, dvd_pos, dvd_size, x_inc, y_inc, FIXED_STEP);
        x_inc = dvd_velocity.velocityX;
        y_inc = dvd_velocity.velocityY;

        if(click_counter >= dvd2_click){
            let dvd2_velocity = move_sprite(dvd2, dvd2_pos, dvd2_size, x2_inc, y2_inc, FIXED_STEP);
            x2_inc = dvd2_velocity.velocityX;
            y2_inc = dvd2_velocity.velocityY;
        }
        if(click_counter >= dvd3_click){
            let dvd3_velocity = move_sprite(dvd3, dvd3_pos, dvd3_size, x3_inc, y3_inc, FIXED_STEP);
            x3_inc = dvd3_velocity.velocityX;
            y3_inc = dvd3_velocity.velocityY;
        }

        frame_accumulator = frame_accumulator - FRAME_TIME_MS;
        updates++;
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
    refresh_sync_hue_images();
    init_text_jitter();
    init_server_temp();
    setInterval(init_server_temp, 30000);
    init_femtanyl_shake();
    init_audio_toggle('femtanylplayer');
    init_audio_toggle('trainplayer');
    init_player_progress('femtanylplayer', 'femtanyl-progress');
    init_player_progress('trainplayer', 'train-progress');
} );