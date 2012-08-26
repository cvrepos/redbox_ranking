function MovieHandler(target){
    this.target = target;
}

MovieHandler.prototype.getTarget = function(){
    return this.target;
}

MovieHandler.prototype.callback = function(content){
     if(content){
        console.log("critics_score is :" + content.critics_score );
        console.log("audience_score is :" + content.audience_score);
        $(this).append("<i><b>[C]</b>" + content.critics_score + " <b>[A]</b>" + content.audience_score + "</i>");
     }
};
var doAjax = function(dataString, onSuccess){
    $.ajax({					
        type: "GET",
        url: "http://127.0.0.1:8989/add?",
        data: dataString,
        context: onSuccess.getTarget(),
        success: onSuccess.callback
    });
};

var movieHandlers = new Array();
$.each( $(".box-wrapper"), function(index, obj){
        var movieHandler = new MovieHandler(obj);
        movieHandlers.push(movieHandler);
});
function schedule(){
    console.log("schedule invoked. queue size=" + movieHandlers.length);
    var i =0;
    var movieHandler;
    while((i < 2) && (movieHandlers.length > 0)){
        movieHandler = movieHandlers.shift();
        var name = $(movieHandler.getTarget()).attr('name');
        if(name != null){
            console.log("Querying movie:" + name);
            doAjax("id=" + name, movieHandler);
            i++;
        }
    }
    if(i == 2){
        setTimeout(schedule, 2000);
    }
}
console.log("scheduling timer 2 sec");
//found that ideally 2 calls/per sec is optimal. 
//playing safe.
setTimeout(schedule, 2000);

