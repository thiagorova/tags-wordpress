var attl_tags;
var attl_tagsQuotaReached;

$(document).ready(function(){
  attl_tags = new Tags("eJwVjDsKgDAUwE5Uef/P5lWKQy1YCiKe37pkCCEOGcCMBCQMjAqhKihq8Et2onAupOgJqZEYmEarIMMFASUTC1Rfn/KcvbZ5z7fubdR+bcccHxBTF9s=");
  var tags_div = $('<div>', {
    id: "authorship-tags-api"
  });
  
  var get_tags = $('<button>', {
    id: "get-tags",
    text: "GET TAGS",
    type: "button"
  });
  
  var tags_notices = $('<p>', {
    id: "tags_api_count",
    text: 'Press "GET TAGS" to analyze your document'
  });

  tags_div.append(tags_notices);
  tags_div.append(get_tags);
  
  attl_tags.getSubscriptionType(function (subscriptionType) {
    if (! (subscriptionType === "premium" || subscriptionType === "beta-premium"  || subscriptionType === "admin"))
     var tags_count = $('<a>', {
          id: "tags_api_notices",
          text: "Upgrade to premium",
          href: "http://www.tags.authorship.me",
          target: "_blank"
        });
       tags_div.append(tags_count);
    });

      $('#tagsdiv-post_tag').children('.inside').prepend(tags_div);
      attl_tagsQuotaReached = false;
});

$(document).on('click','#get-tags',function(e){
  $("#tags_api_count").html('<img id="tags_loading_img" src="' + $("#imageAddress").text() + '" alt="loading tags, please wait">');
  $("#tags_api_count").addClass("tags_count_no_background");
  if (!attl_tagsQuotaReached) {
    var text = tinyMCE.get("content").getContent({format : 'text'});
    attl_tags.setText(text);
    attl_tags.getTagsFull(false,  function(tagResponse) {
      $('#tags_api_count').empty();
      $('#tags_api_count').text( attl_tags.getNumTags().toString() + " tags found");    
      setTags(tagResponse);
      $('#new-tag-post_tag').focus();
      $('#tags_api_count').css("background-color", "#d3f1d2");
      $('#tags_api_count').css("color", "#666");
      $("#tags_api_count").removeClass("tags_count_no_background");
    }, function (error) {
      $('#tags_api_count').text(error);
      $('#get-tags').text("UGRADE TO PREMIUM");
      $('#tags_api_notices').text("");
      $('#tags_api_count').css("background-color", "#FFDBDB");
      $('#tags_api_count').css("color", "#666");
      if (error === "Monthly quota reached. Please upgrade to an premium account") {
        attl_tagsQuotaReached = true;
      }
    });
  } else {
    $('#tags_api_notices')[0].click();
  }
});


//create an add as well!
$(document).on('blur','#new-tag-post_tag',function(e){
  var tags = $('#new-tag-post_tag').val().split(",");
  var text = tinyMCE.get("content").getContent({format : 'text'});
  attl_tags.setText(text);
  var tagsObj = tags.map(function (elem) {
    return {tag: elem.trim(), type: undefined};
  });
  attl_tags.addArray(tagsObj);
});


//deletes tags... still have to figure out how to get the text!
$(document).on('click','.ntdelbutton',function(e){
  var tag = "";
  //getting the text related to the marked X. Given the Wordpress DOM, that means getting the textNodes from the anchors parent. 
  //One of those is an empty tag, while another is what we want...
  var siblings = e.target.parentNode.childNodes;
  for (var i = 0; i < siblings.length; ++i) {
    var item = siblings[i];
    if (item.nodeType === 3) {
      tag = (tag + " " + item.textContent).trim();
    }
  }
  attl_tags.excludeTag(tag);
});



function setTags (tagsArr) {
  var length = tagsArr.length;
  var tagsString = "";

  for (var i = 0; i < length; i++) {
    if(tagsArr[i].tag !=="") {
      if(tagsString === "") tagsString = tagsArr[i].tag;
      else tagsString = tagsString + ", " + tagsArr[i].tag;
    }
  }
  $('#new-tag-post_tag').val(tagsString);
}
