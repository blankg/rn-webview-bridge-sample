(function(){

	var promiseChain = Promise.resolve();

	var callbacks = {};

	var init = function() {

		const guid = function() {
			function s4() {
				return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
			}
			return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
		}

		window.webViewBridge = {
			/**
			 * send message to the React-Native WebView onMessage handler
			 * @param targetFunc - name of the function to invoke on the React-Native side
			 * @param data - data to pass
			 * @param success - success callback
			 * @param error - error callback
			 */
			send: function(targetFunc, data, success, error) {

				var msgObj = {
					targetFunc: targetFunc,
					data: data || {}
				};

				if (success || error) {
					msgObj.msgId = guid();
				}

				var msg = JSON.stringify(msgObj);

				promiseChain = promiseChain.then(function () {
					return new Promise(function (resolve, reject) {
						console.log("sending message " + msgObj.targetFunc);

						if (msgObj.msgId) {
							callbacks[msgObj.msgId] = {
								onsuccess: success,
								onerror: error
							};
						}

						window.postMessage(msg);

						resolve();
					})
				}).catch(function (e) {
					console.error('rnBridge send failed ' + e.message);
				});
			},


		};

		window.document.addEventListener('message', function(e) {
			console.log("message received from react native");

			var message;
			try {
				message = JSON.parse(e.data)
			}
			catch(err) {
				console.error("failed to parse message from react-native " + err);
				return;
			}

			//trigger callback
			if (message.args && callbacks[message.msgId]) {
				if (message.isSuccessfull) {
					callbacks[message.msgId].onsuccess.apply(null, message.args);
				}
				else {
					callbacks[message.msgId].onerror.apply(null, message.args);
				}
				delete callbacks[message.msgId];
			}

		});
	};

	init();
}());