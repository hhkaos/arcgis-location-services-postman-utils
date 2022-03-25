globals = {
  isEnvironmentSelected: function(){
    const serviceEndpoint = pm.variables.get("geocode-service");
    if(typeof(serviceEndpoint) === "undefined"){
      throw new Error('Please, select an "Environment" from the top right dropdown.');
    }
  },
  
  checkIfGlobalsSet: function(variables){
    variables.forEach(variable => {
      const varValue = pm.variables.get(variable);
      if(typeof(varValue) === "undefined"){
        throw new Error(`Please, go to "Environments -> Globals" and set: ${variables.join(', ')}`);
      }
    });
  },

  checkIfCollectionsVarsAreSet: function(variables){
    variables.forEach(variable => {
      const varValue = pm.collectionVariables.get(variable);
      if(typeof(varValue) === "undefined" || /^<.*>$/.test(varValue)){
        throw new Error("Set collection variables using requests in Structure and definitions");
      }
    });
  },
  
  isEnabled: function(reqVar){
    const elem = utils.getParam(reqVar);
    return elem? !elem.disabled: false;
  },
  
  requiredParameters: function(requiredParams){
    requiredParams.forEach(param =>{
      if(!utils.isEnabled(param)){
        throw new Error(`Please enable all required parameter(s): ${requiredParams.join(', ')}`);
      }
    });
  },
  
  getParam: function(name){
      const req = pm.request;
      try{
          if(req.method === "GET"){
              return req.url.query.find(el => el.key === name);
          }else if(req.method === "POST"){
              if(!req.body.urlencoded){
                throw new Error(`You are using a POST request but not sending paramenters in the 'body'`);
              }
              return req.body.urlencoded.find(el => el.key === name)
          }
      }catch(e) {
          throw new Error(`Error in 'getParam(): ${e}`);
      }
  },
  
  checkSupportedValues: function(reqVar, values){
      if(utils.isEnabled(reqVar)){
          const elem = utils.getParam(reqVar);
          if(values.indexOf(elem.value) === -1){
              throw new Error(`Check value for param: '${reqVar}' (accepted values: ${values.join(', ')})`);
          }
      }
  },
  
  isURIEncoded: function(param){
    const getValues = function(reqVar){
      const elem = utils.getParam(reqVar);
      const output = typeof(elem) === "undefined"? elem: elem.value;
      return output;
    };
    
    if(utils.isEnabled(param)){
      const valueParam = getValues(param);
      if(decodeURIComponent(valueParam) == valueParam){
        throw new Error(`apply "Encode URI Component" to '${param}' parameter`);
      }
    }
  },
  
  isValidURL: function(param){
      const url = utils.getParam(param)
    if(!/^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url.value))
      {
         throw new Error(`Please, '${param}' is not a valid URL`); 
      }	
  },
  
  checkIsValidIP: function(param){
    const ip = utils.getParam(param)
    
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip.value)) {  
      return true;
    }  
    throw new Error(`'${param}' is not a valid IP address (##.##.###.###)`);
  },  
  
  checkValueType: function(param, type){      
      if(utils.isEnabled(param)){
        const valueParam = utils.getParam(param);
        let isType;
        const isJSON = str => {
            try {
                if(typeof str === 'object'){
                    return true;    
                }else if(typeof str === 'string' && isNaN(Number(str))){
                    JSON.parse(str);
                    return true;
                }
                return false;
            } catch (e) {
                return false;
            }
        };
        
        const value = decodeURIComponent(valueParam.value);
        const myNum = Number(value);
        if(/^-?\d*$/.test(value) && Number.isInteger(myNum)){
          isType = 'integer';
        }else if(/^-?\d*\.\d*$/.test(value)){
          isType = 'float'; // or number
        }else if(isJSON(value)){
          isType = 'object';
        }else if(Array.isArray(value)){
          isType = 'array';
        }else{
          isType = 'string'
        }
        console.log(`${value} is of type '${isType}'`)

        if(type === isType){
          return true;
        }
        return false;
      }
    },
    
    forceValueType: function(params, type){      
      params.forEach(el => {
        if (utils.isEnabled(el)) {
            if(!utils.checkValueType(el, type)){
                throw new Error(`Value type of '${el}' must be of type '${type}'`)
            }else{
              console.log(`Value type of '${el}' is of type '${type}'`)
            }
        }
     });
    },

    checkSearchExtent: function(){
      if(utils.isEnabled("searchExtent")){
        if(utils.checkValueType('searchExtent', 'object')){
            utils.validateSchema('extent', 'searchExtent', pm);
            utils.isURIEncoded("searchExtent");
        }else if(utils.checkValueType('searchExtent', 'string')){
            if(!/^(-?\d+\.?\d*,?){4}$/.test(utils.getParam('searchExtent').value)){
                throw new Error(`when 'searchExtent' is a 'string' format is '<xmin>,<ymin>,<xmax>,<ymax>'`);    
            }
        }else{
            throw new Error(`searchExtent needs to be string or object`);
        }
      }
    },

    validateSchema: function(schema, param, pm){
      const schemasBase = 'http://rauljimenez.info/arcgis-json-linter/schemas';
      const schemaURL = `${schemasBase}/${schema}.schema.json`
      
      try{
        pm.sendRequest(schemaURL, (err, res) => {         
          var Ajv = require('ajv'),
          ajv = new Ajv({ logger: console, allErrors: true });
          let schema = JSON.parse(res.text());
          let paramValue;
          
          try{
            paramValue = JSON.parse(decodeURIComponent(utils.getParam(param).value))
          }catch(e){
            throw new Error(`'${param}' contains an invalid JSON object`);
          }
          const validate = ajv.compile(schema);
          if(!validate(paramValue)){
            const errors = [];
            validate.errors.forEach(function(error) {
              var message = '';
        
              switch(error.keyword) {
                case 'required':
                  // requirement not fulfilled.
                  message = `Property '${error.params.missingProperty}' is missing`;
                  break;
                case 'type':
                  message = `Wrong type: ${error.dataPath} ${error.message}`;
                  break;
                case 'additionalProperties':
                  message = `'${error.params.additionalProperty}' property not valid`
                  break;
                default:
                  message = `Unknown input error :( ${JSON.stringify(error)}`;
              }

              errors.push(message);
            });
            throw new Error(`invalid JSON schema for '${param}': ${errors.join('. ')}`);
          }else{
              console.log(`Valid JSON schema for '${param}'`)
          }
        });
      }catch(e) {
        throw new Error(` Error invalid ${param}<br>: ${e}.`);
      }   
    }
  }
  