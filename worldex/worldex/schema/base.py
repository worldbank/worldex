from datetime import datetime
from typing import Any, List

from pydantic import BaseModel


class Producers(BaseModel):
    name: str
    abbr: str
    affiliation: str
    role: str


class MetadataInformation(BaseModel):
    title: str
    producers: List[Producers]
    production_date: datetime
    version: str


class PhoneInfo(BaseModel):
    voice: str
    facisimile: str


class AddressInfo(BaseModel):
    deliveryPoint: str
    city: str
    postalCode: str
    country: str
    elctronicMailAddress: str


class OnlineResource(BaseModel):
    linkage: str
    name: str
    description: str
    protocol: str
    function: str


class ContactInfo(BaseModel):
    # TODO:
    phone: str
    address: str
    onlineResource: str


class Contact(BaseModel):
    individualName: str
    organisationName: str
    positionName: str
    contactInfo: List[ContactInfo]
    role: str


class GeometricObject(BaseModel):
    geometricObjectType: str
    geometricObjectCount: int


class VectorSpatialRepresentation(BaseModel):
    topologyLevel: str
    geometricObjects: List[GeometricObject]


class AxisDimensionProperty(BaseModel):
    dimensionName: str
    dimensionSize: int
    resolution: int


class GridSpatialRepresentation(BaseModel):
    numberOfDimensions: int
    axisDimensionProperties: List[AxisDimensionProperty]
    cellGeometry: str
    transformationParameterAvailability: bool


class SpatialRepresentationInfo(BaseModel):
    gridSpatialRepresentation: GridSpatialRepresentation
    vectorSpatialRepresentation: VectorSpatialRepresentation


class ReferenceSystemInfo(BaseModel):
    code: str
    codeSpace: str


class Identifier(BaseModel):
    authority: str
    code: str


class Series(BaseModel):
    name: str
    issueIdentification: str
    page: str


class Citation(BaseModel):
    title: str
    alternativeTitle: str
    date: List[datetime]
    edition: str
    editionData: datetime
    identifier: List[Identifier]
    citedResponsibleParty: List[Contact]
    presentationForm: List[str]
    series: Series
    otherCitationDetails: str
    collectiveTitle: str
    ISBN: str
    ISSN: str


class GraphicOverview(BaseModel):
    fileName: str
    fileDescription: str
    fileType: str


class ResourceFormat(BaseModel):
    name: str
    version: str
    amendmentNumber: str
    specification: str
    fileDecompressionTechnique: str
    FormatDistributer: Contact


class Keyword(BaseModel):
    type: str
    keyword: str
    thesaurusName: str


class LegalConstraint(BaseModel):
    useLimitation: List[str]
    accessConstraints: List[str]
    useConstraints: List[str]
    otherConstraints: List[str]


class SecurityConstraint(BaseModel):
    useLimitation: List[str]
    classification: str
    userNote: str
    classificationSystem: str
    handlingDescription: str


class ResourceConstraint(BaseModel):
    legalConstraints: LegalConstraint
    securityConstraints: SecurityConstraint


class ResourceSpecificUsage(BaseModel):
    specificUsage: str
    usageDateTime: datetime
    userDeterminedLimitations: str
    userContactInfo: List[Contact]


class AggregationInfo(BaseModel):
    aggregateDataSetName: str
    aggregateDataSetIdentifier: str
    associationType: str
    initiativeType: str


class GeographicBoundingBox(BaseModel):
    westBoundLongitude: float
    eastBoundLongitude: float
    southBoundLongitude: float
    northBoundLongitude: float


class GeographicElement(BaseModel):
    geographicBoundingBox: GeographicBoundingBox
    geographicDescription: str


class VerticalElement(BaseModel):
    minimumValue: float
    maximumValue: float
    verticalCRS: Any


class Extent(BaseModel):
    geographicElement: List[GeographicElement]
    temporalElement: List[Any]
    verticalElement: List[VerticalElement]


class SpatialResolution(BaseModel):
    uom: str
    value: float


class CharacterSet(BaseModel):
    codeListValue: str
    codeList: str


class IdentificationInfo(BaseModel):
    citation: Citation
    abstract: str
    purpose: str
    credit: str
    status: str
    pointOfContact: List[Contact]
    resourceMaintenance: List[str]
    graphicOverview: List[GraphicOverview]
    resourceFormat: List[ResourceFormat]
    descriptiveKeywords: List[Keyword]
    resourceConstraints: List[ResourceConstraint]
    resourceSpecificUsage: List[ResourceSpecificUsage]
    aggregationInfo: List[AggregationInfo]
    extent: Extent
    spatialRepresentationType: str
    spatialResolution: SpatialResolution
    language: List[str]
    characterSet: List[CharacterSet]
    topicCategory: List[str]
    supplementalInformation: str


class Description(BaseModel):
    idno: str
    language: str
    characterSet: str
    parentIdentifier: str
    hierarchyLevel: str
    contact: List[Contact]
    dateStamp: datetime
    metadataStandardName: str
    metadataStandardVersion: str
    dataSetURI: str
    spatialRepresentationInfo: List[SpatialRepresentationInfo]
    referenceSystemInfo: List[ReferenceSystemInfo]
    identificationInfo: List[IdentificationInfo]


class GeoSchema(BaseModel):
    metadata_information: MetadataInformation
    description: Description

    pass
