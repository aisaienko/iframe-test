import { cards } from '../config/memorycards';
import { on, off } from '../toolbox/event';
import { openModal } from '../toolbox/modal';
import isAuthenticated from '../toolbox/isauthenticated';

export default class Memory {
    constructor(element) {
        this.element = element;
        this.selectors = {};
    }

    setup() {
        this.originalCardsArray = cards.concat(cards);
        this.shuffleCards();
        this.element.innerHTML = this.buildHTML();
        this.paused = false;
        this.guess = null;
        this.initCache();
        this.bindEvents();
    }

    initCache() {
        this.selectors.memoryCards = this.element.querySelectorAll('.card');
    }

    bindEvents() {
        on('memorymatch.restart', document, this.onRestart.bind(this));
        on('click', this.selectors.memoryCards, this.onCardClicked.bind(this));
    }

    shuffleCards() {
        this.cards = this._shuffle(this.originalCardsArray);
    }

    onRestart() {
        this.reset();
    }

    reset() {
        this.shuffleCards();
        this.setup();
    }

    onCardClicked(event) {
        let card = event.target;
        if (!card.hasAttribute('data-js-card')) {
            card = card.closest('[data-js-card]');
        }
        const inside = card.querySelector('.inside');

        if (!this.paused && !inside.classList.contains('matched') && !inside.classList.contains('picked')) {
            inside.classList.add('picked');
            if (!this.guess) {
                this.guess = card.dataset.id;
            } else if (this.guess === card.dataset.id && !card.classList.contains('picked')) {
                Array.from(this.element.querySelectorAll('.picked')).forEach(pickedCard => pickedCard.classList.add('matched'));
                this.guess = null;
            } else {
                this.guess = null;
                this.paused = true;
                setTimeout(function() {
                    Array.from(this.element.querySelectorAll('.picked')).forEach(pickedCard => pickedCard.classList.remove('picked'));
                    this.paused = false;
                }.bind(this), 600);
            }
            if (this.element.querySelectorAll('.matched').length === this.element.querySelectorAll('.card').length) {
                this.win();
            }
        }
    }

    win() {
        this.paused = true;
        openModal('Congratulations!', 'You won the matching game!');
        // isAuthenticated().then((isLoggedIn) => { 
        //     if (isLoggedIn) {
        //         openModal('Congratulations!', 'You won the matching game!');
        //     }
        // });
    }

    buildHTML() {
        return this.cards.map(card => 
        `<div class="card" data-id="${card.id}" data-js-card>
            <div class="inside">
                <div class="front"><img src="${card.img}" alt="${card.name}" /></div>
                <div class="back"><img src="/dist/images/kie-logo.png" alt="Back side" /></div>
            </div>
        </div>`).join('');
    }

    // Fisher--Yates Algorithm -- https://bost.ocks.org/mike/shuffle/
    _shuffle(array) {
        var counter = array.length, temp, index;
        // While there are elements in the array
        while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);
        // Decrease counter by 1
        counter--;
        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
        }
        return array;
    }
};