(function(){
    
    var scriptSrc = document.currentScript.src;
    var packagePath = scriptSrc.replace('/scripts/scripts.js', '').trim();
    var re = /([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})/i;
    var packageId = re.exec(scriptSrc.toLowerCase())[1];
    
    $(document).ready(function(){
        var baseUrl = window.location.hostname;
        var merchant_ID = $("#userGuid").val();
        var adminID = getadminID();
        var admin_email = getadminemail();
        var merchant_email = getmerchantemail(merchant_ID);
        
        
        //performs your desired action on the newly created item
        function action(item, row, adminID, merchant_email, admin_email) {
            var name = getItemDetails(item);
            console.log(name);
            var data = {
                'merchantemail':merchant_email,
                'adminemail': admin_email,
                'name': name,
                'adminID':adminID
            };
            console.log(data);
            var apiurl = packagePath + '/sendemail.php';
            $.ajax({
                url: apiurl,
                method: "POST",
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function(result){
                    console.log("Success 1");
                    result = JSON.parse(result);
                    if(result.Result == true){
                        console.log("Success 2");
                        update_cache_entry(row);
                    }
                },
                error:function(jqXHR,status,err){

                }
            }); 
            
        }

        function getadminID(){
            console.log("Entered get admin ID function");
            var returnvariable;
            var settings = {
                "url": "https://"+baseUrl+"/api/v2/marketplaces",
                "method": "GET",
                "async":false,
                "timeout": 0
              };
              
              $.ajax(settings).done(function (response) {
                returnvariable = response.Owner.ID;
              });
              return returnvariable;
        }

        function getadminemail(){
            console.log("Entered getadminemail");
            var returnvariable ;
            var settings = {
                "url": "https://"+baseUrl+"/api/v2/marketplaces",
                "method": "GET",
                "timeout": 0,
                "async":false
              };
              
              $.ajax(settings).done(function (response) {
                returnvariable = response.Owner.Email;
              });
              return returnvariable;
              
        }

        function getmerchantemail(ID){
            console.log("Entered get merchant email function");
            var returnvariable;
            var settings = {
                "url": "https://"+baseUrl+"/api/v2/users/"+ID,
                "method": "GET",
                "timeout": 0,
                "async":false
              };
              
              $.ajax(settings).done(function (response) {
                returnvariable = response.Email;
              });
              return returnvariable;
        }

        function getItemDetails(id){
            var returnvariable;
            var settings = {
                "url": "https://"+baseUrl+"/api/v2/items/"+id,
                "method": "GET",
                "async":false
            };
            
            $.ajax(settings).done(function (response) {
                returnvariable = response.Name;
            });
            console.log(returnvariable);
            return returnvariable;
        }
        
        //interrupts item creation by catching the item ID (before the page reloads) and storing it in a custom table
        //then resumes the reload
        if($("body").hasClass("seller-upload-page")){
            $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
                if (options.type.toLowerCase() === "post" && options.url.toLowerCase().indexOf('/user/item/createitems') >= 0) {
                    let success = options.success;
                    
                    options.success = function(data, textStatus, jqXHR) {
                        if (data.Success) {
                            let itemId = data.Guid;
                            saveItem(itemId);
                        }
                        if (typeof(success) === "function") return success(data, textStatus, jqXHR);
                    };
                }
            });
        }
        
        //this runs after the resumed reload.
        //queries the custom table to find the newest item (status == 0)
        if($("body").hasClass("seller-items")){
            var settings = {
                "url": "https://"+baseUrl+"/api/v2/plugins/"+packageId+"/custom-tables/cache/",
                "method": "GET"
            };
              
            $.ajax(settings).done(function (response) {
                var item_list = response.Records;
                item_list.forEach(element => {
                    if(element.status == 0){
                        var sync_item_id = element.item;
                        var row_id = element.Id;
                        action(sync_item_id, row_id, adminID, merchant_email, admin_email);
                    }
                });
            });
        }
        
        //saves item id in custom table
        function saveItem(id){
            var settings = {
                "url": "https://"+baseUrl+"/api/v2/plugins/"+packageId+"/custom-tables/cache/rows",
                "method": "POST",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json"
                },
                "data": JSON.stringify({"item":id, "status": 0}),
            };

            $.ajax(settings);
        }
        
        //after action() is performed, this updates the newly created item in the custom table to be taken care of
        //this way the next time this script is run, it will ignore this item
        function update_cache_entry(row){
            var data = {
                "status": 1
            };
            var settings = {
                "url": "https://"+baseUrl+"/api/v2/plugins/"+packageId+"/custom-tables/cache/rows/"+row,
                "method": "PUT",
                "headers": {
                  "Content-Type": "application/json"
                },
                "data": JSON.stringify(data)
            };
            $.ajax(settings);
        }
    });
})();
