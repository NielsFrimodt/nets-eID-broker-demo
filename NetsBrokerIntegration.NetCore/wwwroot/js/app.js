var app = new Vue({
    el: '#app',
    data: {
        baseUrl: '/Home/LoggedInSuccess?',
        popupActivated: false,
        wref: {},
        debugMode: false,
        persistedParameters: {
            landingpageVersion: '1.1',
            advancedOptions: false,
            language: 'da-DK',
            idp: {
                mitid: true,
                nemid: true
            },
            mitidSpecific: {
                reference_text: '',
                require_psd2: false,
                nemid_pid: false,
                loa_value: 'https://data.gov.dk/concept/core/nsis/Substantial',
                enable_step_up: false
            },
            nemidSpecific: {
                apptransactiontext: '',
                nemid_private_to_business: false,
            },
            uxType: 'redirect',
            ssn: false
        }
    },
    computed: {
        queryBuilder: function () {
            let paramsValues = {}
            let scope = []
            let acr = []
            paramsValues.mitidEnabled = this.persistedParameters.idp.mitid
            paramsValues.nemidEnabled = this.persistedParameters.idp.nemid
            paramsValues.language = this.persistedParameters.language
            if (paramsValues.nemidEnabled) {
                scope.push('nemid')
                acr = acr.concat(this.persistedParameters.nemidSpecific.acr)
                paramsValues.nemid_private_to_business = this.persistedParameters.nemidSpecific.nemid_private_to_business
            }
            if (paramsValues.mitidEnabled) {
                scope.push('mitid')
            }
            if (acr.length > 0) {
                paramsValues.acr = acr.join(' ')
            }
            if (this.persistedParameters.ssn) {
                scope.push('ssn')
            }
            if (scope.length > 0) {
                paramsValues.scope = scope.join(' ')
            }
            if (this.persistedParameters.mitidSpecific.reference_text) {
                paramsValues.mitid_reference_text = this.b64(this.persistedParameters.mitidSpecific.reference_text)
            }
            if (this.persistedParameters.mitidSpecific.require_psd2) {
                paramsValues.mitid_require_psd2 = this.persistedParameters.mitidSpecific.require_psd2
            }
            if (this.persistedParameters.mitidSpecific.nemid_pid) {
                paramsValues.nemid_pid = this.persistedParameters.mitidSpecific.nemid_pid
            }
            if (this.persistedParameters.mitidSpecific.loa_value) {
                paramsValues.mitid_loa_value = this.persistedParameters.mitidSpecific.loa_value
            }
            if (this.persistedParameters.nemidSpecific.apptransactiontext) {
                paramsValues.nemid_apptransactiontext = this.b64(this.persistedParameters.nemidSpecific.apptransactiontext)
            }
            let paramsValuesEncoded = ''
            for (var prop in paramsValues) {
                if (paramsValues.hasOwnProperty(prop)) {
                    var k = encodeURIComponent(prop),
                        v = encodeURIComponent(paramsValues[prop])
                    paramsValuesEncoded = paramsValuesEncoded + k + "=" + v + '&'
                }
            }
            return paramsValuesEncoded.slice(0, -1)
        },
        formValid: function() {
            return this.idpSelected && this.mitIdValid && this.uxSelected;
        },
        mitIdValid: function () {
            return this.persistedParameters.idp.mitid ? this.persistedParameters.mitidSpecific.loa_value : true;
        },
        uxSelected: function () {
            return !(this.persistedParameters.uxType === '');
        },
        idpSelected: function () {
            return (this.persistedParameters.idp.mitid || this.persistedParameters.idp.nemid)
        }
    },
    methods: {
        b64: function (content) {
            return btoa(unescape(encodeURIComponent(content)))
        },
        toggleAdvanced: function() {
            this.persistedParameters.advancedOptions = !this.persistedParameters.advancedOptions
        },
        basicSignin: function() {
            window.location.href = this.baseUrl
        },
        callOP: function(event) {
            if (event !== undefined) {
                event.preventDefault()
            }
            if(Object.keys(this.wref).length !== 0 && !this.wref.closed){
                this.onFocus()
            } else {
                if (this.persistedParameters.uxType === 'redirect') {
                    if (event !== undefined) {
                        event.target.reset()
                    }
                    window.location.href = this.baseUrl + this.queryBuilder
                }else if(this.persistedParameters.uxType==='popup'){
                    if (this.persistedParameters.mitidSpecific.transactionSigning || this.persistedParameters.nemidSpecific.transactionSigning){
                        this.popupwindow(this.baseUrl+this.queryBuilder, 'Sign in','878','640')
                    } else {
                        let idpCount = 0;
                        for (let k in this.persistedParameters.idp) {
                            if (this.persistedParameters.idp[k]) {
                                idpCount++
                            }
                        }

                        if (idpCount == 1) {
                            this.popupwindow(this.baseUrl + this.queryBuilder, 'Sign in', '452', '640')
                        } else {
                            this.popupwindow(this.baseUrl + this.queryBuilder, 'Sign in', '452', '692')
                        }
                    }
                }
            }
        },
        popupwindow: function(n, t, i, r){
            this.popupActivated = true
            let u = window.outerHeight / 2 + window.screenY - r / 2
            let f = window.outerWidth / 2 + window.screenX - i / 2
            this.wref = window.open(n, t, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + i + ', height=' + r + ', top=' + u + ', left=' + f)
            this.wref.focus()
        },
        onFocus: function(){
            if(Object.keys(this.wref).length !== 0){
                setTimeout(function () { app.wref.focus() }, 100)
            }
        },
        closeWindow: function(){
            if(Object.keys(this.wref).length !== 0){
                this.wref.close()
                this.popupActivated = false
                this.wref = {}
            }
            this.popupActivated = false
        },
        receiveMessage: function(event){
            if (event.data === 'CLOSE') {
                this.closeWindow()
            } else if (event.data === 'SUCCESS') {
                this.closeWindow()
                window.location.href = '/Secure/Claims'
            }
        }
    },
    created: function () {
        window.addEventListener("message", this.receiveMessage, false)
        window.addEventListener("focus", this.onFocus)
        if (location.hostname === "localhost") {
            this.debugMode = true
        }
    }
})