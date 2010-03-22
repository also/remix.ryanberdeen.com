STATIC_HTML = FileList.new('src/html/*.html')
STATIC_JS = FileList.new('src/js/*.js')
STATIC_PY = FileList.new('src/py/*.py')
REMIX_PY = FileList.new('src/py/remix/**/*.py')
STATIC_CSS = FileList.new('src/css/*.css')
LIB_JS = FileList.new(['lib/remixjs/dist/remix.js', 'lib/remixjs/src/editor/editor.js', 'lib/remixjs/lib/swfobject/swfobject.js', 'lib/sylvester/sylvester.js', 'lib/jslint/fulljslint.js', 'lib/prototype/prototype.js'])
LIB_SWF = 'lib/remixjs/dist/remix.swf'

LIB_GESTALT = 'lib/gestalt'

STATIC = STATIC_HTML + STATIC_JS + STATIC_CSS + STATIC_PY + LIB_JS + LIB_JS + [LIB_SWF, LIB_GESTALT]

file 'lib/remixjs/dist/remix.js' do
  # TODO this probably isn't right
  sh 'cd lib/remixjs; rake dist/remix.js'
end

file 'lib/remixjs/dist/remix.swf' do
  # TODO this probably isn't right
  sh 'cd lib/remixjs; rake dist/remix.swf'
end

file 'dist/site' => STATIC + REMIX_PY do
  sh 'mkdir -p dist/site'
  sh "cp -r #{STATIC} dist/site"
  sh "rm -f dist/site/remixpy.zip"
  sh "cd src/py/remix; zip ../../../dist/site/remixpy.zip #{REMIX_PY.pathmap('%f')}"
end

task :default => ['dist/site']

task :clean do
  sh 'rm -rf dist'
end
