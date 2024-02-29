import { on, off } from './event';

class Modal {
    constructor(options) {
        this.options = Object.assign({
            title: '',
            content: ''
        }, options);

        this.selectors = {};
        this.initCache();
        this.bindEvents();
    }

    initCache() {
        this.selectors.modal = this.generateModalMarkup();
        this.selectors.exitButtons = this.selectors.modal.querySelectorAll('[data-js-modal-exit]');
    }

    bindEvents() {
        on('click', this.selectors.exitButtons, this.onExitClicked.bind(this));
    }

    onExitClicked(event) {
        event.preventDefault();
        if (this.options.notExitable) {
            return;
        }
        this.destroyModal();
    }

    destroyModal() {
        off('click', this.selectors.exitButtons);
        this.selectors.modal.classList.remove("open");
        this.selectors.modal.remove;
    }

    open() {
        this.selectors.modal.classList.add("open");
    }

    generateModalMarkup() {
        const exitButtonClass = this.options.notExitable ? 'h-hidden' : '';
        const modalHtml = 
            `<div class="modal">
                <div class="modal-bg" data-js-modal-exit></div>
                <div class="modal-container">
                    <h1 class="modal-title">${this.options.title}</h1>
                    <div class="modal-content">${this.options.content}</div>
                    <button class="modal-close ${exitButtonClass}" data-js-modal-exit>X</button>
                </div>
            </div>`;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        const modalElement = tempDiv.firstElementChild;
        document.body.appendChild(modalElement);
        return modalElement;
    }
}

function openModal(title, content, notExitable) {
    var modal = new Modal({ title, content, notExitable });
    modal.open();
    return modal;
}

export { openModal };


