SRC = FileList.new(['graph.js', 'index.html', 'remix.css'])

file 'lib/remixjs/dist/remix.js' do
  # TODO this probably isn't right
  sh 'cd lib/remixjs; rake dist/remix.js'
end

file 'lib/remixjs/dist/remix.swf' do
  # TODO this probably isn't right
  sh 'cd lib/remixjs; rake dist/remix.swf'
end

file 'dist/site' => SRC + ['lib/remixjs/dist/remix.js', 'lib/remixjs/dist/remix.swf'] do
  sh 'mkdir -p dist/site'
  sh "cp #{SRC} dist/site"
  sh 'cp lib/remixjs/dist/remix.js dist/site'
  sh 'cp lib/remixjs/dist/remix.swf dist/site'
  sh 'cp lib/remixjs/src/editor/editor.js dist/site'
  sh 'cp lib/remixjs/lib/swfobject/swfobject.js dist/site'
  sh 'cp lib/prototype/prototype.js dist/site'
end

task :default => ['dist/site']

task :clean do
  sh 'rm -rf dist'
end