
/*
* Returns an array of 3-element arrays [title, src, rank]
* where each 3-element array represents a youtube video
* found by searching Youtube with query <query>.
*/
var extension = 

{
query : "",
limit : 5,
links : ["<span id = 'links'>", "</span>"],
videos : ["<span id = 'videos'>", "</span>"],
parent : "",
set_query : function(query){this.query = query;},
set_limit : function(limit){this.limit = limit;},

/* init : function(){
	this.query = "";
	this.limit = 5;
	this.links = ["<span id = 'links'>", "</span>"];
	this.videos = ["<span id = 'videos'>", "</span>"];
	this.parent = "";
},
*/

youtube_request : function(orderby, max_results){
	var youtube_request = "https://gdata.youtube.com/feeds/api/videos?"+
    "q="+this.query+
    "&orderby="+orderby+
    "&max-results="+String(max_results)+
    "&v=2";	

    var videos = [];
	$.ajax({
		url: youtube_request,
		type: 'get',
		dataType: 'html',
		async: false,
		success: function(data) {
			entries = $(data).find("entry");
			//console.log("Vids found: "+String(entries.length));
			for(i = 0; i < entries.length; i++){
				var entry = $(entries[i]).find("content");
				var src = $(entry).attr("src");
				//console.log("src for single entry: "+String(src));				
				var title = $(entries[i]).find("title").text();
				//console.log("Title for single entry: "+String(title));								
				var video = [title, src, i/entries.length];
				videos.push(video);						
			}
		}
	})    
	console.log("typeof videos: "+String(typeof(videos)));
	return videos;
},

/*
* Returns list of elements contained in both arr1 and arr2.
* If indices is not undefined, it should be a list. In that case,
* function returns a list of elements in arr2 that have values equal
* to those of an element of arr1 at all indices in <indices>.
*/
intersect_by_index : function(arr1, arr2, indices){
	var output = [];
	var map = {};
	var maps = [];
	if(indices){
		for(i = 0; i < arr1.length; i++){
			var val_to_match = [];			
			for(j = 0; j < indices.length; j++){
				val_to_match.push(arr1[i][indices[j]]);
			}
		map[val_to_match] = true;
		}

		for(i = 0; i < arr2.length; i++){
			match_val = [];
			for(j = 0; j < indices.length; j++){
				match_val.push(arr2[i][indices[j]]);
			}
			if(map[match_val]){
				output.push(arr2[i]);
			}
		}		
	}
	else{
		for(i = 0; i < arr1.length; i++){
			map[arr1[i]] = true;
		}
		for(i = 0; i < arr2.length; i++){
			if(map[arr2[i]]){
				output.push(arr2[i]);
			}
		}
	}

	return output;
},

/*
Quicksorts a list based on elements of its sublists (if sublists == true)
at index <index> within each sublist (if sublists == true)
*/
quicksort_by_index : function(list, sublists, index){
		for(k = 0; k < list.length-1; k++){
			if(list[k][index] > list[k + 1][index]){
				break;
			}
			return list;
		}	
		if(list.length == 0 || list.length == 1){return list};
		var i = list.length/2; //Math.round(Math.random()*list.length)%list.length;
		//console.log(typeof(list));
		var pivot = list.splice(i, 1);
		var less = [];
		var greater = [];
		for(j = 0; j < list.length; j++){
			//console.log("list[j], line 87: "+String(list[j]));
			elem = sublists ? list[j][index] : list[j];
			if(elem <= pivot){
				less.push(list[j])
			}	
			else{
				greater.push(list[j])
			}
		}
		sorted = false;
		return this.quicksort_by_index(less.concat([pivot]).concat(greater), true, 2);


},


videos_array : function(max_results){
	var rating_desc = this.youtube_request("rating", max_results);
	var views_desc = this.youtube_request("viewCount", max_results);
	var intersection = this.intersect_by_index(rating_desc, views_desc, [0, 1]);
	console.log("Intersection length: "+String(intersection.length))
	var sorted = this.quicksort_by_index(intersection, true, 2);
	return sorted;
},


/*
* Inserts html as second-to-last element in an array of html elements
*/
add_html : function(array, html){
	array.splice(array.length-1, 0, html);
	return array;
},


insert_video : function(html, src, title){
	console.log("Inserting video with source: "+src+" and title: "+title);
	var html = (html == undefined) ? this.html : html;
	var link = "<iframe name='"+title+"' type='text/html' class='yt_video' width='640' height='390'"+
	"src='"+src+"' frameborder='0'/>";
	return this.add_html(this.videos, link);
},

insert_link : function(html, src, title){
	console.log("Inserting link with src: "+src+" and title: "+title);
	var video = 'iframe[src="'+src+'"]';
 	// console.log("Length of matching videos: "+ String(video.length) );
	var title = (title == undefined) ? $(video).attr("name") : title;
	var html = (html == undefined) ? this.links : html;

	var link = "<a href='#' class = 'extension_link' name='"+title+"'>"+title+" </a>";
	this.add_html(html, link);
	var return_link = 'a[name="'+title+'"]';
	// console.log("Length of link inserted: "+ String(return_link.length) );
	return [return_link, video];
},

bind_link : function(link, video){
	console.log("In bind_link with link: "+String($(link).length));
	$(link).click(function(){
		$(video).toggle();
	});
},

add_link : function(src, title){
	var link_and_video = this.insert_link(undefined, src, title);
	var link = link_and_video[0];
	var video = link_and_video[1]; 
	this.bind_link(link, video);
},

// End helper functions.

add_video : function(src, title){
	this.insert_video(this.videos, src, title);
},

/*
* Loads up to <limit> videos from the array <videos>, which contains
* elements that are arrays of the form [title, src, rank], into
* the page.
* after <parent> element into a container specified by the string
* containerHTML
*/
load_videos: function(parent, videos, limit){
	if(!limit){
		limit = this.limit;
	}
	else{
		this.limit = limit;
	}
	// var container_html = containerHTML ? containerHTML : this.videos;
	var bind_array = [];

	for(var i = 0; i < Math.min(videos.length, limit); i++){
		var video = videos[i];
		var title = video[0];
		var src = video[1];
		this.add_video(src, title);
		bind_array.push(this.insert_link(undefined, src, title));
	}
	// console.log("Injected HTML: "+container_html.join(""));
	$(parent).after(this.videos.join("")).after(this.links.join(""));

	for(var j = 0; j < bind_array.length; j++){
		var link_and_video = bind_array[j];
		var link = $(link_and_video[0]);
		var vid = $(link_and_video[1]);
		this.bind_link(link, vid);
	}
	$('iframe').hide();

},

load: function(parent, videos, limit){
	for(i = 0; i < Math.min(videos.length, limit); i++){
		var video = videos[i];
		var title = video[0];
		var src = video[1];
		this.add_video(src, title);
		this.add_link(src, title);
	}

}


// Closing curly brace for object below:
}


function main(){
	console.log("In main!");
	extension.parent = $('span[dir="auto"]');
	extension.set_query($(extension.parent).text());
	if(extension.query != "Main Page"){
		var videos = extension.videos_array(50);
		console.log("videos: "+String(videos.length));
		extension.load_videos(extension.parent, videos, extension.limit);
	}
}

main();

