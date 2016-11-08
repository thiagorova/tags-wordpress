;(function( window ) {

  'use strict';

var APIerror = null;

var Tags = function (key) {
    this.text = "";
    this.tags = null;
    this.tagsFull = null;
    this.priv = {}
    this.priv.key = key;
    var baseAdd = "http://www.api.authorship.me"
//    var baseAdd = "http://localhost:4000"
    this.priv.address = baseAdd + "/tags/";
    this.priv.userAdd = baseAdd + "/users/";
    this.priv.newText = true;		//marks whether the tags from the text have been already generated
    
  };
  
    //this is just a shorthand
   Tags.prototype.hidden = {};
   var hid = Tags.prototype.hidden;
   
//public methods
    Tags.prototype.setText = function (text) {
      if (this.text !== text) this.priv.newText = true;
      this.text = text;
    };

    Tags.prototype.getTags = function(excludeIrrelevant, callback, callbackError) {
      if (typeof callback === 'undefined') { callback = null; }
      if (typeof callbackError === 'undefined') { callbackError = null; }      
      if (this.tags === null || this.priv.newText === true) {
        this.getTagsFull(excludeIrrelevant, function (fullTags) {
          if (callback !== null) callback(this.tags);
        }, 
        callbackError);
        this.priv.newText = true;
      } else if (callback !== null) callback(this.tags);
      
    };

    Tags.prototype.getTagsFull = function (excludeIrrelevant, callback, callbackError) {
      if (typeof callback === 'undefined') { callback = null; }      
      if (typeof excludeIrrelevant === 'undefined') { excludeIrrelevant = false; }
      if (typeof callbackError === 'undefined') { callbackError = null; }      
      if (this.tags === null || this.priv.newText === true) {
//the AJAX callback is an anonymous function, and therefore does not belong in the prototype scope. That means that it has no reference to the initial object caller. Hence, "me = this" to keep it
        var me = this;
        apiCall("POST", this.priv.address + "indexFull", buildIndexJSON(this.text, excludeIrrelevant, this.priv.key), function(response) {
//          me.priv.newText = false;	//marking the API call as done... unless the text is changes, the tags have been discovered
          var tagsObj = JSON.parse( response ).tags;
          //in the unlikely case of an empty response, the API will return an object with an empty tag Name. This will turm the response into an empty array
          if (tagsObj !== null) tagsObj = tagsObj.filter(function (tag) { return tag.tag !== undefined});
          //which automattically works, since all below functions expect an array anyway...
          for (var tag in tagsObj) {
            tagsObj[tag].origin = "system"
          }
//in case a custom tag was generated, the tag object is not null anymore, in which case some special treatment is necessary not to lose data
          if (me.tagsFull === null)  {
            me.tags = tagsObj.map(function (tagObj) { return {"tag": tagObj.tag} });
            me.tagsFull = tagsObj;
          } else {
            me.tags = me.getUserTags().concat(tagsObj.map(function (tagObj) { return {"tag": tagObj.tag} }));
            me.tagsFull = me.tagsFull.filter(function (tag) { return tag.origin === "custom"}).concat(tagsObj);
          }
          if(callback !== null) callback(tagsObj);
        }, 
        callbackError);
      } else if(callback !== null) callback(this.tagsFull);
    };

    Tags.prototype.getUserTags = function() {
      var userTags = this.tagsFull.filter(function(tag) {
        return tag.origin === "custom"
      });
      var userTagsClean = userTags.map(function(tag) {
        return tag.tag
      });
      return userTagsClean;
    };
  
    Tags.prototype.getSystemTags = function() {
      var systemTags =  this.tagsFull.filter(function(tag) {
          return tag.origin === "system"
        });
      var systemTagsClean = systemTags.map(function(tag) {
        return tag.tag
      });
      return systemTagsClean;
    };

    Tags.prototype.getNumTags = function () {
      if (this.tags !== null) return this.tags.length;
      return 0;
    }

    Tags.prototype.addTag = function (tag, type, callback, callbackError) {
      if (typeof callback === 'undefined') { callback = null; } 
      if (typeof callbackError === 'undefined') { callbackError = null; }
      if (typeof type === 'undefined') { type = "unknown"; }
      var tagToAdd = hid.getTag(this.tagsFull, tag);
      if (tagToAdd === null) {
        tagToAdd = hid.customTag(tag, type);
        apiCall("POST", this.priv.address + "create", buildTagJSON(tagToAdd, this.text, this.priv.key), function (response) {
          if (callback !== null) callback(response);
        }, 
        callbackError);
        if(this.tags == null) {
          this.tags = [{"tag": tag}];
          this.tagsFull = [tagToAdd];
        } else {
          this.tags.push({"tag": tag});
          this.tagsFull.push(tagToAdd);
        }
        return true
      }
      return false;
    };

    Tags.prototype.excludeTag = function (tag, callbackError) {
      if (typeof callbackError === 'undefined') { callbackError = null; }
      var tagToExclude = hid.getTag(this.tagsFull, tag);
      if (tagToExclude !== null) {
        apiCall("PUT", this.priv.address + "updateExcluded", buildTagJSON(tagToExclude, this.text, this.priv.key), callbackError);
        var index = this.tagsFull.indexOf(tagToExclude);
        this.tagsFull.splice(index, 1);
        var index = this.tags.indexOf(tag);
        this.tags.splice(index, 1);                 
      }
    };

    Tags.prototype.excludeArray = function (toExclude, callbackError) {
      if (typeof callbackError === 'undefined') { callbackError = null; }    
      for (var tag in toExclude) {
        this.excludeTag(tag.tag);
      }
    };

    Tags.prototype.updateTag = function (tag, type, callbackError) {
      if (typeof callbackError === 'undefined') { callbackError = null; }    
      if (type !== null) {
        var tagToChange = hid.getTag(this.tagsFull, tag);
        if (tagToChange !== null) {
          tagToChange.type = type;
          apiCall("PUT", this.priv.address + "updateType", buildTagJSON(tagToChange, this.text, this.priv.key), null, null);
        }
      }
    };
    
    Tags.prototype.getTagTypes = function () {
      var types = {"person": "Person", "measure": "Measure", "artWork": "Work of Art", "organization": "Organization", "fieldterminology": "Field terminology", "location": "Location", "continent": "Continent", "unknown": "Tag type unknown"};
      return types;
    };
    
    Tags.prototype.updateArray = function (data) {
      for (var tag in data) {
        this.updateTag(data[tag].tag, data[tag].type);
      }
    };

    Tags.prototype.addArray = function (data) {
      for (var tag in data) {
        this.addTag(data[tag].tag, data[tag].type);
      }
    };
    
    Tags.prototype.getUser = function (callback, callbackError) {
      if (typeof callback === 'undefined') { callback = null; }    
      if (typeof callbackError === 'undefined') { callbackError = null; }
        apiCall("GET", this.priv.userAdd + "show", {"apikey": this.priv.key }, function (response) {
          var user = JSON.parse( response );
           if (callback !== null) callback(user.login);
       }, callbackError);
    };
    
    Tags.prototype.getSubscriptionType = function (callback, callbackError) {
      if (typeof callback === 'undefined') { callback = null; }    
      if (typeof callbackError === 'undefined') { callbackError = null; }
        apiCall("GET", this.priv.userAdd + "showSubscription", {"apikey": this.priv.key }, function (response) {
          var user = JSON.parse( response );
           if (callback !== null) callback(user.subscription);
       }, callbackError);
    };

//private tags methods
    hid.getTag = function(fullTags, tag) {
        if (fullTags === null) return null;
        var len = fullTags.length;
        for (var i = 0; i < len; i++) {
            if (fullTags[i].tag == tag) {
             return fullTags[i];
            }
        }
        return null;
    }

  hid.customTag = function (name, type) {
    if (typeof type === 'undefined') { type = 'unknown'; }
    var tag = {}
    tag.tag = name;
    tag.type = type;
    tag.relevance = 1.0;
    tag.origin = "custom";
    return tag;
  }

    var createXHTTP = function(callback) {
        var xhttp;
        if (window.XMLHttpRequest) {
         xhttp = new XMLHttpRequest();
        } else {
                // code for IE6, IE5
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xhttp.onreadystatechange = callback;
        return xhttp;
    };

//a few helper functions
    var apiCall = function(method, api, data, callbackOK, callbackError) {
      if (typeof callbackOK === 'undefined') { callbackOK = null; }
      if (typeof callbackError === 'undefined') { callbackError = null; }          
        var xhttp = createXHTTP( function(response) {
          if (xhttp.readyState == 4) {
            if (xhttp.status == 200) {
              if(callbackOK !== null) callbackOK(xhttp.responseText);
            } else {
              if (xhttp.responseText) {
                APIerror = JSON.parse(xhttp.responseText).error;
                if(callbackError !== null) callbackError(APIerror);
              } else {
                if(callbackError !== null) callbackError("the system seems to be down. Please try again later");
              }
            }
          }
        });

        if (method === "GET") {
          var getParams = "";
          var next = false;
          for (var key in data) {
            if (data.hasOwnProperty(key)) {
              if (next) getParams += "&";
              getParams += key + "=" + encodeURI(data[key]);
              next = true;
            }
          }
          xhttp.open(method, api + "?" + getParams, true);
          xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");          
        } else {
          xhttp.open(method, api, true);
          xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        }

        xhttp.setRequestHeader("Origin", window.top.location.href.split("?")[0]);
        //it is necessary to repeat the if because the request headers cannot be set before the xhttp.open()
        if (method === "GET")   xhttp.send();
        else xhttp.send(JSON.stringify( data ));
    };

var buildIndexJSON = function(text, acceptance, key, filename) {
  if (typeof filename === 'undefined') { filename = ''; }
  return {
      apikey: key,
      text: text,
      clean: acceptance,
      filename: ""
    };
}

var buildTagJSON = function (tag, text, key) {
  return {
      apikey: key,
      text: text,
      tag: [{
        name: tag.tag,
        type: tag.type,
        relevance: tag.relevance
      }]
  };
}

window.Tags = Tags;


})( window );

