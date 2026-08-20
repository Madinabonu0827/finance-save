// So'nggi himoya qatlami — kutilmagan xato UI'ga stack trace emas, tushunarli xabar sifatida boradi.
function notFound(req, res) {
  res.status(404).json({ message: 'Bunday endpoint mavjud emas' });
}

function errorHandler(err, req, res, next) {
  console.error('❌ Kutilmagan xato:', err);
  res.status(500).json({ message: 'Server xatosi yuz berdi' });
}

module.exports = { notFound, errorHandler };
