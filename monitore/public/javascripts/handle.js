const socket = io();
socket.on('echo', function(rows){
    console.log("Socket on");
    html = JSON.stringify(rows);
   console.log(html);
   location.reload();
  // alert()
   
});