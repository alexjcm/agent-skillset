<?xml version="1.0" encoding="utf-8"?><?mso-application progid="Excel.Sheet"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
    <xsl:template match="notaDespacho">
		<Workbook>
			  <Worksheet ss:Name="Reporte Test">
				<Table>
                    <Column ss:Width="144"/>
                       <Column ss:Width="120"/>
					<xsl:call-template name="header" />
				  	<xsl:call-template name="body" />
				</Table>				
			</Worksheet>
		</Workbook>
	</xsl:template>
	    <xsl:template name="header">
		<Row>
			<Cell ss:MergeAcross="1"><Data ss:Type="String">CDI: <xsl:value-of select="cabecera/codigoCD" /><xsl:text> </xsl:text><xsl:value-of select="cabecera" /></Data></Cell>
		</Row>

    <xsl:template name="body">		
       <xsl:for-each select="//detallesPropios">
          <Row>
          <Cell><Data ss:Type="String"><xsl:value-of select="codigoBarras" /></Data></Cell>
        </Row>
    	</xsl:for-each>
</xsl:stylesheet>