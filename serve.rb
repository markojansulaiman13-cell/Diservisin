#!/usr/bin/env ruby
# Lightweight zero-dependency static server for Diservisin (macOS built-in Ruby)
require 'socket'
require 'uri'

ROOT = File.expand_path(__dir__)
PORT = (ARGV[0] || 8091).to_i

MIME = {
  '.html' => 'text/html; charset=utf-8',
  '.css'  => 'text/css; charset=utf-8',
  '.js'   => 'application/javascript; charset=utf-8',
  '.json' => 'application/json; charset=utf-8',
  '.png'  => 'image/png',
  '.jpg'  => 'image/jpeg',
  '.svg'  => 'image/svg+xml',
  '.ico'  => 'image/x-icon'
}

server = TCPServer.new('127.0.0.1', PORT)
$stdout.sync = true
puts "Diservisin running at http://127.0.0.1:#{PORT}"

loop do
  client = server.accept
  Thread.new(client) do |sock|
    begin
      req_line = sock.gets
      next unless req_line
      method, raw_path = req_line.split(' ')
      while (line = sock.gets)
        break if line == "\r\n" || line == "\n"
      end

      path = URI.decode_www_form_component((raw_path || '/').split('?').first)
      path = '/index.html' if path == '/'
      rel = path.sub(%r{\A/+}, '')
      full = File.expand_path(File.join(ROOT, rel))
      full = File.join(ROOT, 'index.html') unless full.start_with?(ROOT) && File.file?(full)

      data = File.binread(full)
      ctype = MIME[File.extname(full).downcase] || 'application/octet-stream'
      sock.write("HTTP/1.1 200 OK\r\nContent-Type: #{ctype}\r\nContent-Length: #{data.bytesize}\r\nCache-Control: no-cache\r\nConnection: close\r\n\r\n")
      sock.write(data) if method != 'HEAD'
    rescue StandardError => e
      warn e.message
    ensure
      sock.close rescue nil
    end
  end
end
