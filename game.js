const GAME_WIDTH = 360
const GAME_HEIGHT = 360 

const canvas = document.querySelector(".layer-game")
const stats_list = document.querySelector(".stats-list")
const game_console_messages = document.querySelector(".console-list")
const game_console_input = document.querySelector(".console-input")

canvas.width = GAME_WIDTH 
canvas.height = GAME_HEIGHT 


/** @type {CanvasRenderingContext2D} */
const c = canvas.getContext("2d")

c.imageSmoothingEnabled = false

const MAX_STAT = 100

function clamp(value, min, max) {
    return Math.min(Math.max(min, value), max) 
}

class Sprite {
    constructor(x, y, image_source) {
        this.x = x
        this.y = y
        this.width = 0
        this.height = 0
        this.loaded = false
        this.image = new Image()
        this.image.src = image_source
        this.image.onload = () => {
            this.loaded = true
            this.width = this.image.width
            this.height = this.image.height
        }
    }

    draw(context) {
        if (!this.loaded) return

        context.save()
        context.drawImage(this.image, this.x - this.width/2, this.y - this.height/2, this.width, this.height)
        context.restore()
    }
}

function random_range(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
}

function write_to_console(message) {
    const item = document.createElement("li")
    item.classList.add("console-list-item")
    item.innerHTML = message
    game_console_messages.appendChild(item)
    game_console_messages.scrollTo(0, game_console_messages.scrollHeight)
    
}

const command_functions = {
    "help": () => {
        let message = `
            ============<br>
            help command<br>
            ============<br>
            > feed {food_item} -- Currently a work in progress<br>
            > give {item} -- Currently a work in progress, will just output the word you put<br>
            > teach {word} -- Chance to add word to pet vocab. Decreases energy.<br>
            > change_needs_time {time_in_seconds} -- Dev command. Changes how fast needs decrease. Default: 1800 
        `
        write_to_console(message)
    },
    "feed": food => { pet.feed(food) },
    "give": item => {
        if (item === atob("cG9n")) { 
            let message = "UE9He1lvdSBmb3VuZCB0aGUgZmlyc3QgUEVHRyEgKDEvMyl9"
            write_to_console(atob(message))
            return
        }

        write_to_console(`You gave ${pet.name} a ${item.toLowerCase()}`)
    },
    "teach": word => {
        pet.train(word)
    },
    "change_needs_time": time => {
        pet.last_update = Date.now()
        pet.needs_timer = time
    },
}

function parse_command(raw_command) {
    const command_parts = raw_command.toLowerCase().split(" ")
    const command_function = command_functions[command_parts[0]]

    if (command_function) {
        command_function(...command_parts.slice(1))
    } else {
        write_to_console(`Invalid command: ${command_parts[0]}`)
    }
}

function get_random_key(obj) {
  let keys = Object.keys(obj).filter(key => {
    if (obj.hunger > 25) {
        return obj[key] > 0 && key !== "energy"
    } else {
        return obj[key] > 0 && key 
    }
  });

  if (keys.length === 0) {
    return null
  }

  return keys[Math.floor(Math.random() * keys.length)];
}

class Food {
    constructor(name, satiety_value) {
        this.name = name
        this.satiety_value = satiety_value
    }
}

const foods = {
    apples: new Food("Apples", 10)
}

class Pet extends Sprite {
    constructor(name, species, image_source) {
        super(canvas.width/2, 225, image_source)
        this.name = name 
        this.species = species // This is a placeholder for now. Currently unused
        this.alive = true
        this.vocab = []
        this.needs_timer = 1800
        this.needs = {
            energy: random_range(75, MAX_STAT),
            fun: random_range(50, 80),
            social: random_range(10, 75),
            hygiene: random_range(0, MAX_STAT),
            hunger: random_range(40, 90),
        }
        this.favorites = {
            foods: [],
            games: [],
        }
        this.last_update = Date.now()
    }

    feed(foodType) {
        // Might scrape this idea and figure something else out
        let food_value = 0
        if (foods[foodType]) {
            food_value = foodType.satiety_value
        } else {
            food_value = 5
        }
        
        if (this.needs.hunger + food_value > MAX_STAT) {
            food_value = MAX_STAT - this.needs.hunger
        }

        let message = `${this.name} ate some food!`

        if (this.favorites.foods.includes(foodType)) {
            message = `${this.name} loves ${foodType}! OMNOMNOM`
        }

        this.needs.hunger += food_value
        
        if (this.needs.hunger > MAX_STAT) {
            this.needs.hunger = MAX_STAT 
        }

        write_to_console(message)
        update_stat_el("hunger", this.needs.hunger)
    }

    update_needs() {
        /**
         * Reduces needs every this.needs_timer seconds (Default: 1800)
         * by a random amount each time.
         */
        if (!this.alive) return

        let now = Date.now()
        let seconds_since_last_update = (now - this.last_update) / 1000
        let loop_count = Math.floor(seconds_since_last_update / this.needs_timer)

        for (let i = 0; i < loop_count; i++) {
            this.last_update = now

            let random_need = get_random_key(this.needs)
            if (random_need === null) {
                write_to_console(`${pet.name} has died...`)
                this.alive = false
                return
            }

            this.needs[random_need] -= random_range(3, 7) 
            
            if (this.needs[random_need] < 0) {
                this.needs[random_need] = 0
            }

            update_stat_el(random_need, this.needs[random_need])
            write_to_console(`${random_need} decreased`)
        }
    }

    set_needs_value(key, value) {
        this.needs[key] = value
        update_stat_el(key, this.needs[key])
    }

    train(word) {
        let energy_used = random_range(5, 10)
        let success_roll = random_range(1, 100)
        let message = ""

        this.needs.energy -= energy_used

        console.log(energy_used, success_roll)
        if (success_roll < 75) {
            message = `${this.name} learned the word "${word.toLowerCase()}"! (-${energy_used} energy)`
            this.vocab.push(word)
        } else {
            message = `${this.name} struggled hard, but couldn't quite learn the word... (-${energy_used} energy)`
        }

        write_to_console(message)
        update_stat_el("energy", this.needs.energy)
    }

    play() {
        // decrease energy
        // increase fun
        // not sure what else this will do
    }

    groom() {
        // not sure about this yet
        this.needs.hygiene += 10
    }

    socialize() {
        // not sure about this yet
        this.needs.mood += 10
        this.needs.social += 1
    }

    pet() {
        /**
         * you should be able to pet the ... pet... with the cursor or via command.
         * too many pets will start to reduce fun. /shrug
         */
    }
}

function change_width(now, max) {
    if (now > max) now = max
    return (now / max) * 100
}

function update_stat_el(stat, value) {
    needs[stat].querySelector(".stat-value").textContent = `${value}/${MAX_STAT}`
    const change_value = change_width(value, MAX_STAT)
    let color = COLOR.GOOD
     
    if (change_value <= 25) {
        color = COLOR.BAD
    } else if (change_value <= 50) {
        color = COLOR.OK
    }

    const inner_stat_bar = needs[stat].querySelector(".inner-stat-bar")
    inner_stat_bar.style.width = `${change_value}%`
    inner_stat_bar.style.backgroundColor = color
}

const pet = new Pet("Hong Lu", "Dragon", "honglu.png")
let needs = {}

const background_src = "background.png"
const background_image = new Image()
background_image.src = background_src

const COLOR = {
    GOOD: "#a3be8c",
    OK: "#ebcb8b",
    BAD: "#bf616a",
}

for (let key in pet.needs) {
    needs[key] = document.querySelector(`.stats-list-item[data-stat="${key}"]`)
    update_stat_el(key, pet.needs[key])
}

function game_loop() {
    // currently everything is static but eventually i want to have the pet sprite bounce around
    // and sometimes have a bubble over its head with one of its vocab words.
    // it should also bounce when you click on it
    c.clearRect(0, 0, canvas.width, canvas.height)
    c.drawImage(background_image, 0, 0)
    pet.draw(c)
    pet.update_needs()

    window.requestAnimationFrame(game_loop)
}
window.requestAnimationFrame(game_loop)

game_console_input.addEventListener("keypress", e => {
    if (e.key === "Enter") {
        const input_value = e.target.value

        if (pet.alive) parse_command(input_value)

        e.target.value = ""
    }
})