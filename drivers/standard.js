steal(function() {
	//don't do any of this if in rhino (IE selenium)
	if (navigator.userAgent.match(/Rhino/)) {
		return;	
	}
	
	
	FuncUnit._window = null;
	var newPage = true, changing;
	var makeArray = function(arr){
		var narr = [];
		for (var i = 0; i < arr.length; i++) {
			narr[i] = arr[i]
		}
		return narr;
	}
	FuncUnit._open = function(url){
		changing = url;
		if (newPage) {
			FuncUnit._window = window.open(url, "funcunit");
		}
		else {
			FuncUnit._window.location = url;
			
		}
		
	}
	var unloadLoader, 
		loadSuccess, 
		currentDocument,
		onload = function(){
			FuncUnit._window.document.documentElement.tabIndex = 0;
			setTimeout(function(){
				FuncUnit._window.focus();
				var ls = loadSuccess
				loadSuccess = null;
				if (ls) {
					ls();
				}
			}, 0);
			Synthetic.removeEventListener(FuncUnit._window, "load", onload);
		},
		onunload = function(){
			removeListeners();
			setTimeout(unloadLoader, 0)
			
		},
		removeListeners = function(){
			Synthetic.removeEventListener(FuncUnit._window, "unload", onunload);
			Synthetic.removeEventListener(FuncUnit._window, "load", onload);
		}
	unloadLoader = function(){
		removeListeners();
		
		Synthetic.addEventListener(FuncUnit._window, "load", onload);
		
		//listen for unload to re-attach
		Synthetic.addEventListener(FuncUnit._window, "unload", onunload)
	}
	
	//check for window location change, documentChange, then readyState complete -> fire load if you have one
	var poller = function(){
		if (FuncUnit._window.document !== currentDocument) { //we have a new document
			if (FuncUnit._window.document.readyState == "complete") {
				if (loadSuccess) {
					FuncUnit._window.focus();
					FuncUnit._window.document.documentElement.tabIndex = 0;
					var ls = loadSuccess;
					loadSuccess = null;
					ls();
				}
				currentDocument = FuncUnit._window.document;
			}
		}
		setTimeout(arguments.callee, 1000)
	}
	
	FuncUnit._onload = function(success, error){
		loadSuccess = success;
		if (!newPage) 
			return;
		newPage = false;
		if (jQuery.browser.msie) //check for readyState
		{
			poller();
		}
		else {
			unloadLoader();
		}
		
	}
	var confirms = [], prompts = [];
	FuncUnit.confirm = function(answer){
		confirms.push(!!confirms)
	}
	FuncUnit.prompt = function(answer){
		prompts.push(answer)
	}
	FuncUnit._opened = function(){
		FuncUnit._window.alert = function(){}
		FuncUnit._window.confirm = function(){
			return confirms.shift();
		}
		FuncUnit._window.prompt = function(){
			return prompts.shift();
		}
	}
	FuncUnit.$ = function(selector, context, method){
	
		var args = makeArray(arguments);
		for (var i = 0; i < args.length; i++) {
			args[i] = args[i] === FuncUnit.window ? FuncUnit._window : args[i]
		}
		
		var selector = args.shift(), context = args.shift(), method = args.shift(), q;
		
		//convert context	
		if (context == FuncUnit.window.document) {
			context = FuncUnit._window.document
		}
		else 
			if (typeof context == "number" || typeof context == "string") {
				context = FuncUnit._window.frames[context].document;
			}
		
		
		if (FuncUnit._window.jQuery && parseFloat(FuncUnit._window.jQuery().jquery) >= 1.3) {
			q = jQuery(FuncUnit._window.jQuery(selector, context).get());
		}
		else {
			q = jQuery(selector, context);
		}
		
		return q[method].apply(q, args);
	}
	
	$(window).unload(function(){
		if (FuncUnit._window) 
			FuncUnit._window.close();
	})
		


});

