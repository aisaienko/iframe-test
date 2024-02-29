import ThirdPartyLoader from 'components/global/ThirdPartyLoader';
import { deepMerge } from 'toolbox/deepMerge';
import { mix } from 'core/mixwith';
import LoaderMixin from 'mixins/Loader';
import DataLayer from 'services/DataLayer';
import { ajax } from 'toolbox/ajax';
import httpStatusCode from 'constants/httpStatusCode';

/**
 * This is a description of the EngagementHub constructor function.
 * @class
 * @classdesc Loads script to embed and resize an Engagement Hub iframe responsively
 * @extends ThirdPartyLoader
 */
export default class EngagementHub extends mix(ThirdPartyLoader).with(LoaderMixin) {
    /**
     * Constructor of the class that mainly merge the options of the components
     * @param {HTMLElement} element HTMLElement of the component
     * @param {object} options options that belongs to the component
     */
    constructor(element, options = {}) {
        super(element, deepMerge({
            url: null, // url of the third-party service to call
            iframeUrl: null, // url of Engagement Hub iframe
            iframeOptions: {}, // iframe options
            customerInfoUrl: null, // get customer info URL
        }, options));
    }

    /**
     * All selectors must be cached. Never cache elements that are out of the component scope
     */
    initCache() {
        this.selectors.container = document.createElement('div');
        this.selectors.container.id = 'engagement-hub-container';
        this.element.appendChild(this.selectors.container);
    }

    /**
     * Init component states
     */
    initState() {
        this.state.isFrameReady = false;
        const customer = DataLayer.getCustomer();
        this.state.currentCustomerNo = customer && customer.customerNo;
        this.state.isWaitingLogin = false;
        super.initState();
    }

    /**
     * Should contain only event listeners and nothing else
     * All the event handlers should be into a separated function. No usage of anonyous function
     */
    bindIframeEvents() {
        this.pymParent.onMessage('iframe:loaded', this.onIframeResized.bind(this));
        this.pymParent.onMessage('iframe:isauthenticated', this.onIsLoggedIn.bind(this));
    }

    /**
     * Executed when load event is triggered or triggered directly when component is initialized if window.onload has been
     * triggered before the initialization of the component. Is called after all the other hooks
     */
    initLoad() {
        this.addLoader(this.element, { overlay: true });
        super.initLoad();
    }

    /**
     * On script load handler, called when the third-party is loaded
     * @param {Object} data - Response of the provider
     */
    onScriptLoaded(data) {
        if (window.pym) {
            const iframeUrl = new URL(this.options.iframeUrl);
            const iframeOptions = Object.assign(this.options.iframeOptions, {
                xdomain: iframeUrl.origin,
            });
            this.pymParent = new window.pym.Parent(this.selectors.container.id, this.options.iframeUrl, iframeOptions);
            this.bindIframeEvents();
        }

        super.onScriptLoaded(data);
    }

    /**
     * On iframe height changed event handler
     */
    onIframeResized() {
        if (!this.state.isFrameReady) {
            this.onFrameReady();
        }
    }

    /**
     * Removes container loader when the Modiface frame is ready
     */
    onFrameReady() {
        this.state.isFrameReady = true;
        this.removeLoader(this.element);
        this.element.style.removeProperty('min-height');
    }

    /**
     * Handler of 'isAuthenticated' request from iframe
     * Checks if current user is authenticated
     */
    onIsLoggedIn() {
        ajax(this.options.customerInfoUrl)
            .then(this.onGetCustomerInfoSuccess.bind(this))
            .catch(this.onGetCustomerInfoFailed.bind(this));
    }

    /**
     * Callback after get customer successful
     *
     * @param {Object} response Data
     */
    onGetCustomerInfoSuccess(response) {
        const {
            loggedIn, isLoyaltyMember, emailId, customerNo,
        } = response;

        if (loggedIn && isLoyaltyMember && this.state.currentCustomerNo === customerNo) {
            this.pymParent.sendMessage('parent:isauthenticated', JSON.stringify({ loggedIn, emailId }));
        } else {
            window.location.reload();
        }
    }

    /**
     * Get content failure handler
     *
     * @param {Object} response Data
     */
    onGetCustomerInfoFailed(response) {
        if (response.status === httpStatusCode.AUTHENTIFICATION_ERROR) {
            if (!this.state.isWaitingLogin) {
                // Waiting for login callback, the flag is required to avoid the event to be attached more than 1 time
                this.state.isWaitingLogin = true;
                Event.once('login.success', this.onLoginSuccess, this);
                Event.once('registration.success', this.onLoginSuccess, this);
                Event.once('login.modal.close', this.onLoginModalClose, this);
            }
        } else if (response instanceof Error) {
            window.location.reload();
        }
    }

    /**
     * Login success
     */
    onLoginSuccess() {
        this.state.isWaitingLogin = false;
        const customer = DataLayer.getCustomer();
        console.log(customer);
    }

    /**
     * Login modal close event handler
     */
    onLoginModalClose() {
        const customer = DataLayer.getCustomer();
        console.log('login modal closed', customer);
        // window.location.reload();
    }

    /**
     * Destroy is called automatically after the component is being removed from the DOM
     * You must always destroy the listeners attached to an element to avoid any memory leaks
     */
    destroy() {
        if (this.pymParent) {
            this.pymParent.remove();
        }
    }
}
