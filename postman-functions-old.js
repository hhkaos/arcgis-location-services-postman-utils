//Define global functions
Object.prototype.isEnvironmentSelected = (pm) => {
	const serviceEndpoint = pm.variables.get("geocode-service");
	if(typeof(serviceEndpoint) === "undefined"){
		throw new Error('Please, select an "Environment" from the top right dropdown.');
	}
}

Object.prototype.checkIfGlobalsSet = (variables) => {
	variables.forEach(variable => {
		const varValue = pm.variables.get(variable);
		if(typeof(varValue) === "undefined"){
			throw new Error(`Please, go to "Environments -> Globals" and set: ${variables.join(', ')}`);
		}
	});
}

Object.prototype.isEnabled = reqVar => {
	const elem = _.getParam(reqVar);
	return elem? !elem.disabled: false;
}

Object.prototype.requiredParameters = (pm,requiredParams) => {
	const req = pm.request.toJSON();
	requiredParams.forEach(param =>{
		if(!_.isEnabled(param)){
			throw new Error(`Please enable all required parameter(s): ${requiredParams.join(', ')}`);
		}
	});
}

Object.prototype.getParam = name => {
    const req = pm.request;
    try{
        if(req.method === "GET"){
            return req.url.query.find(el => el.key === name);
        }else if(req.method === "POST"){
            return req.body.urlencoded.find(el => el.key === name)
        }
    }catch(e) {
        throw new Error(`Error in 'getParam()'`);
        return true;
    }
}

Object.prototype.checkSupportedValues = (reqVar, values) => {
    if(_.isEnabled(reqVar)){
        const elem = _.getParam(reqVar);
        if(values.indexOf(elem.value) === -1){
            throw new Error(`Check value for param: '${reqVar}' (accepted values: ${values.join(', ')})`);
        }
    }
};

Object.prototype.isURIEncoded = param => {
	const getValues = function(reqVar, values){
		const elem = _.getParam(reqVar);
		const output = typeof(elem) === "undefined"? elem: elem.value;
		return output;
	};
	
	if(_.isEnabled(param)){
		const valueParam = getValues(param);
		if(decodeURIComponent(valueParam) == valueParam){
			throw new Error(`Please, encode the ${valueParam} parameter`);
		}
	}
}

Object.prototype.isValidURL = (param) => {
    const url = _.getParam(param)
	if(!/^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url.value))
    {
       throw new Error(`Please, '${param}' is not a valid URL`); 
    }	
}

Object.prototype.checkIsValidIP = param => {  
  const ip = _.getParam(param)
  if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip.value)) {  
    return true;
  }  
  throw new Error(`'${param}' is not a valid IP address (##.##.###.###)`);
}  

Object.prototype.checkValueType = (param, type) => {  
    console.log("Checking:",param)
    if(_.isEnabled(param)){
        console.log(`param '${param}' is enabled`)
		const valueParam = _.getParam(param);
        let matchType = true;
        const isJSON = str => {
            try {
                if(typeof str === 'object'){
                    return true;    
                }else if(typeof str === 'string' && str !== "1"){
                    JSON.parse(str);
                    return true;
                }
                return false;
            } catch (e) {
                return true;
            }
        };
        
        switch(type){
            case 'integer':
                if(!Number.isInteger(eval(valueParam.value))){
                   matchType = false; 
                }
                break;
            case 'object':
                if(!isJSON(valueParam.value)){
                    matchType = false; 
                }
                break;
            case 'array':
                if(!Array.isArray(eval(valueParam.value))){
                    matchType = false; 
                }
                break;            
            default:
                const paramType = typeof valueParam.value;
                if(paramType != type){
                    matchType = false;
                }
        }
        if(!matchType){
            throw new Error(`Value type of '${param}' must be of type '${type}'`);  
        }
    }
}