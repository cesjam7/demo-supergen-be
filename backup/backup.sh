utor: Pablo Papes
#START

# Folders and files

TIME=`date +"%d-%m-%y"`
MYSQLFILE="BDSG-$TIME.sql"
MYSQLBACKUPDIR="/projects/supergen-be/backup/bd"

# Delete old backups
find $MYSQLBACKUPDIR -mtime +30 -exec rm -Rf -- {} \;

# Begin Backup Process
mysqldump -u Developer1 -pPa$$w0rd --routines supergen > $MYSQLBACKUPDIR/$MYSQLFILE
