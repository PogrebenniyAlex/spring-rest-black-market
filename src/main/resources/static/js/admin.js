traverson.registerMediaType(TraversonJsonHalAdapter.mediaType,
    TraversonJsonHalAdapter);

var rootUri = '/';
var api = traverson.from(rootUri);

var View = Backbone.View.extend({
    el: $(".container"),
    initialize: function () {
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
    },
    render: function() {
        var $tbody = this.$("#ads-list tbody"),
            next = this.$("#next"),
            prev = this.$("#prev");
        $tbody.empty();
        _.each(this.model.embedded("ads"), function(data) {
            $tbody.append(new adView({model : data}).render().el);
        }, this);
        this.model.link("next") ? next.show() : next.hide();
        this.model.link("prev") ? prev.show() : prev.hide();
    },
    events: {
        "click #next": "goNext",
        "click #prev": "goPrev"
    },
    goNext: function(e) {
        e.preventDefault(e);
        this.go("next");
    },
    goPrev: function(e) {
        e.preventDefault(e);
        this.go("prev");
    },
    go: function(where){
        var data = URI(this.model.link(where).href()).query(true);
        ads.fetch({ data: data });
    }
});

var adView = Backbone.View.extend({
    tagName : "tr",
    template : _.template($("#ad-template").html()),
    render : function() {
        this.$el.html(this.template(this.model));
        return this;
    }
});

var AdsModel = Backbone.RelationalHalResource.extend({});

var ads = new AdsModel();

api.jsonHal()
    .follow('ads', 'search', 'my')
    .getUri(function(err, uri) {
        if (err) {
            console.log(err);
            return;
        }
        ads.url = uri;
        ads.fetch();
    });

var view = new View({ model: ads }).render();

var order = new Backbone.Model({
    location: {
        city: "Kyiv"
    },
    user: "user/1" //TODO add discoverable
});

api.jsonHal()
    .follow('ads')
    .getUri(function(err, uri) {
        if (err) {
            console.log(err);
            return;
        }
        order.url = uri;
    });

api.jsonHal()
    .follow('users', 'search', 'current-user')
    .getResource(function(err, res) {
        if (err) {
            console.log(err);
            return;
        }
        order.set("user", res._links.self.href);
    });
var fields = [{
    name: "amount",
    label: "Колличество:",
    control: "input",
    type: "number"
}, {
    name: "currency",
    label: "Тип валюты:",
    control: "input"
}, {
    name: "rate",
    label: "Курс:",
    control: "input",
    type: "number"
}, {
    name: "type",
    label: "Тип ордера:",
    placeholder: "BUY or SELL",
    control: "input"
}, {
    control: "button",
    label: "Создать заявку"
}];

var form = new Backform.Form({
    el: $("#form"),
    model: order,
    fields: fields,
    events: {
        "submit": function(e) {
            e.preventDefault();
            this.model.save()
                .done(function(result) {
                    ads.fetch();
                })
                .fail(function(error) {
                    console.error(error);
                });
            return false;
        }
    }
});
form.render();