function notify(summary, body)
    os.execute(string.format('notify-send "%s" "%s"', summary, body))
end

function on_start_file()
    local title = mp.get_property("media-title")
    if title then
        notify("Now Playing", title)
    end
end

function on_end_file()
    local title = mp.get_property("media-title")
    if title then
        notify("Finished Playing", title)
    end
end

mp.register_event("start-file", on_start_file)
mp.register_event("end-file", on_end_file)
